package downloader

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"ybdownloader/internal/core"
)

var ytDlpProgressRe = regexp.MustCompile(
	`\[download\]\s+([\d.]+)%\s+of\s+~?\s*([\d.]+\s*\w+)`,
)

var ytDlpSpeedRe = regexp.MustCompile(
	`at\s+([\d.]+)\s*(\w+/s)`,
)

// ytDlpMetadata represents the JSON output of `yt-dlp --dump-json`.
type ytDlpMetadata struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Uploader    string  `json:"uploader"`
	Channel     string  `json:"channel"`
	Duration    float64 `json:"duration"`
	Thumbnail   string  `json:"thumbnail"`
	Description string  `json:"description"`
}

var _ core.Downloader = (*YtDlpDownloader)(nil)

// YtDlpDownloader implements core.Downloader using the yt-dlp binary.
type YtDlpDownloader struct {
	ytdlpManager  *YtDlpManager
	ffmpegManager *FFmpegManager
	fs            core.FileSystem
	settings      func() (*core.Settings, error)
	jsRuntime     string // cached JS runtime detection result
	jsRuntimeOnce sync.Once
}

// NewYtDlpDownloader creates a new yt-dlp based downloader.
func NewYtDlpDownloader(
	ytdlpManager *YtDlpManager,
	ffmpegManager *FFmpegManager,
	fs core.FileSystem,
	getSettings func() (*core.Settings, error),
) *YtDlpDownloader {
	return &YtDlpDownloader{
		ytdlpManager:  ytdlpManager,
		ffmpegManager: ffmpegManager,
		fs:            fs,
		settings:      getSettings,
	}
}

func (d *YtDlpDownloader) getJSRuntime() string {
	d.jsRuntimeOnce.Do(func() {
		name, path := d.ytdlpManager.GetJSRuntimePath()
		if name != "" {
			d.jsRuntime = name + ":" + path
			slog.Info("detected JS runtime for yt-dlp", "runtime", d.jsRuntime)
			return
		}

		slog.Info("no JS runtime found, attempting to download deno")
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		if err := d.ytdlpManager.EnsureJSRuntime(ctx); err != nil {
			slog.Warn("failed to download deno, yt-dlp may have limited functionality", "error", err)
			return
		}

		name, path = d.ytdlpManager.GetJSRuntimePath()
		if name != "" {
			d.jsRuntime = name + ":" + path
			slog.Info("deno installed for yt-dlp", "runtime", d.jsRuntime)
		}
	})
	return d.jsRuntime
}

// FetchMetadata retrieves video metadata using yt-dlp --dump-json.
func (d *YtDlpDownloader) FetchMetadata(ctx context.Context, url string) (*core.VideoMetadata, error) {
	slog.Debug("fetching metadata via yt-dlp", "url", url)

	ytdlpPath, err := d.ytdlpManager.GetYtDlpPath()
	if err != nil {
		return nil, fmt.Errorf("yt-dlp not available: %w", err)
	}

	args := []string{
		"--dump-json",
		"--no-download",
		"--no-playlist",
		"--no-warnings",
	}

	if rt := d.getJSRuntime(); rt != "" {
		args = append(args, "--js-runtimes", rt)
	}

	args = append(args, url)

	cmd := exec.CommandContext(ctx, ytdlpPath, args...) //nolint:gosec
	output, err := cmd.Output()
	if err != nil {
		var exitErr *exec.ExitError
		if errors.As(err, &exitErr) && len(exitErr.Stderr) > 0 {
			stderr := strings.TrimSpace(string(exitErr.Stderr))
			slog.Error("yt-dlp metadata fetch failed", "url", url, "stderr", stderr)
			return nil, fmt.Errorf("yt-dlp: %s", stderr)
		}
		slog.Error("yt-dlp metadata fetch failed", "url", url, "error", err)
		return nil, fmt.Errorf("failed to fetch metadata: %w", err)
	}

	var meta ytDlpMetadata
	if err := json.Unmarshal(output, &meta); err != nil {
		return nil, fmt.Errorf("failed to parse yt-dlp metadata: %w", err)
	}

	author := meta.Channel
	if author == "" {
		author = meta.Uploader
	}

	thumbnail := meta.Thumbnail
	if thumbnail == "" && meta.ID != "" {
		thumbnail = fmt.Sprintf("https://i.ytimg.com/vi/%s/hqdefault.jpg", meta.ID)
	}

	slog.Info("metadata fetched via yt-dlp",
		"videoId", meta.ID,
		"title", meta.Title,
		"duration", meta.Duration,
	)

	return &core.VideoMetadata{
		ID:          meta.ID,
		Title:       meta.Title,
		Author:      author,
		Duration:    meta.Duration,
		Thumbnail:   thumbnail,
		Description: meta.Description,
	}, nil
}

// Download downloads a video/audio using yt-dlp.
func (d *YtDlpDownloader) Download(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error {
	slog.Info("starting yt-dlp download",
		"itemId", item.ID,
		"url", item.URL,
		"format", item.Format,
	)

	ytdlpPath, err := d.ytdlpManager.GetYtDlpPath()
	if err != nil {
		return fmt.Errorf("yt-dlp not available: %w", err)
	}

	settings, err := d.settings()
	if err != nil {
		return fmt.Errorf("failed to load settings: %w", err)
	}

	if err := d.fs.EnsureDir(item.SavePath); err != nil {
		return fmt.Errorf("failed to create save directory: %w", err)
	}

	outputTemplate := filepath.Join(item.SavePath, "%(title)s.%(ext)s")

	args := d.buildDownloadArgs(item, settings, outputTemplate)

	if rt := d.getJSRuntime(); rt != "" {
		args = append(args, "--js-runtimes", rt)
	}

	if ffmpegPath, err := d.ffmpegManager.GetFFmpegPath(); err == nil {
		args = append(args, "--ffmpeg-location", ffmpegPath)
	}

	args = append(args, settings.YtDlpExtraFlags...)
	args = append(args, item.URL)

	slog.Debug("yt-dlp command", "path", ytdlpPath, "args", args)

	cmd := exec.CommandContext(ctx, ytdlpPath, args...) //nolint:gosec
	cmd.Env = append(os.Environ(), "PYTHONDONTWRITEBYTECODE=1", "PYTHONUNBUFFERED=1")

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to create stdout pipe: %w", err)
	}

	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start yt-dlp: %w", err)
	}

	scanner := bufio.NewScanner(stdout)
	scanner.Split(scanLinesOrCR)
	var finalFilePath string
	var printedPath string
	var lineCount int

	for scanner.Scan() {
		line := scanner.Text()
		lineCount++
		slog.Debug("yt-dlp output", "line", line, "lineNum", lineCount)

		if progress, ok := parseYtDlpProgress(line, item.ID); ok {
			slog.Info("yt-dlp progress", "percent", progress.Percent, "speed", progress.Speed, "total", progress.TotalBytes, "itemId", item.ID)
			onProgress(progress)
			continue
		}

		if strings.Contains(line, "[Merger]") || strings.Contains(line, "[ExtractAudio]") ||
			strings.Contains(line, "[VideoConvertor]") || strings.Contains(line, "[VideoRemuxer]") {
			onProgress(core.DownloadProgress{
				ItemID:  item.ID,
				State:   core.StateConverting,
				Percent: 0,
			})
			continue
		}

		if path := extractDestinationPath(line); path != "" {
			finalFilePath = path
			continue
		}

		// Lines not matching any known pattern may be from --print after_move:filepath.
		// These are bare paths printed after all processing is done.
		trimmed := strings.TrimSpace(line)
		if trimmed != "" && !strings.HasPrefix(trimmed, "[") && !strings.HasPrefix(trimmed, "WARNING") {
			printedPath = trimmed
		}
	}

	if err := cmd.Wait(); err != nil {
		if ctx.Err() == context.Canceled {
			return ctx.Err()
		}
		return fmt.Errorf("yt-dlp download failed: %w", err)
	}

	if printedPath != "" {
		item.FilePath = printedPath
	} else if finalFilePath != "" {
		item.FilePath = finalFilePath
	}

	onProgress(core.DownloadProgress{
		ItemID:  item.ID,
		State:   core.StateDownloading,
		Percent: 100,
	})

	slog.Info("yt-dlp download complete", "itemId", item.ID, "filePath", item.FilePath)
	return nil
}

func (d *YtDlpDownloader) buildDownloadArgs(item *core.QueueItem, settings *core.Settings, outputTemplate string) []string {
	args := []string{
		"--newline",
		"--no-colors",
		"--no-playlist",
		"--no-overwrites",
		"--windows-filenames",
		"--print", "after_move:filepath",
		"-o", outputTemplate,
	}

	switch item.Format {
	case core.FormatMP3:
		args = append(args,
			"-x",
			"--audio-format", "mp3",
			"--audio-quality", ytDlpAudioQuality(settings.DefaultAudioQuality),
			"--format-sort", "acodec:aac",
		)
	case core.FormatM4A:
		args = append(args,
			"-x",
			"--audio-format", "m4a",
			"--audio-quality", ytDlpAudioQuality(settings.DefaultAudioQuality),
			"--format-sort", "acodec:aac",
		)
	case core.FormatMP4:
		args = append(args,
			"-f", ytDlpVideoFormat(settings.DefaultVideoQuality),
			"--format-sort", "vcodec:h264,acodec:aac",
			"--merge-output-format", "mp4",
			"--remux-video", "mp4",
		)
	default:
		slog.Warn("unknown format for yt-dlp, using best available", "format", item.Format)
	}

	return args
}

func ytDlpAudioQuality(q core.AudioQuality) string {
	switch q {
	case core.AudioQuality128:
		return "128K"
	case core.AudioQuality192:
		return "192K"
	case core.AudioQuality256:
		return "256K"
	case core.AudioQuality320:
		return "320K"
	default:
		return "192K"
	}
}

func ytDlpVideoFormat(q core.VideoQuality) string {
	switch q {
	case core.VideoQuality360p:
		return "bv*[height<=360]+ba/b[height<=360]/b"
	case core.VideoQuality480p:
		return "bv*[height<=480]+ba/b[height<=480]/b"
	case core.VideoQuality720p:
		return "bv*[height<=720]+ba/b[height<=720]/b"
	case core.VideoQuality1080p:
		return "bv*[height<=1080]+ba/b[height<=1080]/b"
	case core.VideoQualityBest:
		return "bv*+ba/b"
	default:
		return "bv*[height<=720]+ba/b[height<=720]/b"
	}
}

func parseYtDlpProgress(line string, itemID string) (core.DownloadProgress, bool) {
	matches := ytDlpProgressRe.FindStringSubmatch(line)
	if matches == nil {
		return core.DownloadProgress{}, false
	}

	percent, _ := strconv.ParseFloat(matches[1], 64)
	totalBytes := parseSizeString(matches[2])
	downloadedBytes := int64(float64(totalBytes) * percent / 100)

	var speed int64
	if speedMatch := ytDlpSpeedRe.FindStringSubmatch(line); speedMatch != nil {
		speedVal, _ := strconv.ParseFloat(speedMatch[1], 64)
		speed = parseSizeToBytes(speedVal, strings.TrimSuffix(speedMatch[2], "/s"))
	}

	var eta int64
	if speed > 0 && totalBytes > 0 {
		remaining := totalBytes - downloadedBytes
		eta = remaining / speed
	}

	return core.DownloadProgress{
		ItemID:          itemID,
		State:           core.StateDownloading,
		Percent:         percent,
		DownloadedBytes: downloadedBytes,
		TotalBytes:      totalBytes,
		Speed:           speed,
		ETA:             eta,
	}, true
}

func parseSizeString(s string) int64 {
	s = strings.TrimSpace(s)
	for i, c := range s {
		if !((c >= '0' && c <= '9') || c == '.') {
			val, _ := strconv.ParseFloat(strings.TrimSpace(s[:i]), 64)
			return parseSizeToBytes(val, s[i:])
		}
	}
	val, _ := strconv.ParseFloat(s, 64)
	return int64(val)
}

func parseSizeToBytes(val float64, unit string) int64 {
	unit = strings.TrimSpace(strings.ToUpper(unit))
	switch {
	case strings.HasPrefix(unit, "G"):
		return int64(val * 1024 * 1024 * 1024)
	case strings.HasPrefix(unit, "M"):
		return int64(val * 1024 * 1024)
	case strings.HasPrefix(unit, "K"):
		return int64(val * 1024)
	default:
		return int64(val)
	}
}

var destinationRe = regexp.MustCompile(
	`\[(Merger|ExtractAudio|VideoConvertor|VideoRemuxer|download)\] Destination: (.+)`,
)

var alreadyDownloadedRe = regexp.MustCompile(
	`\[download\] (.+) has already been downloaded`,
)

var moveRe = regexp.MustCompile(
	`\[MoveFiles\] Moving file (.+) to (.+)`,
)

func extractDestinationPath(line string) string {
	if matches := moveRe.FindStringSubmatch(line); len(matches) > 2 {
		return strings.TrimSpace(matches[2])
	}
	if matches := destinationRe.FindStringSubmatch(line); len(matches) > 2 {
		return strings.TrimSpace(matches[2])
	}
	if matches := alreadyDownloadedRe.FindStringSubmatch(line); len(matches) > 1 {
		return strings.TrimSpace(matches[1])
	}
	return ""
}

// scanLinesOrCR is a bufio.SplitFunc that splits on \n, \r\n, or bare \r.
// yt-dlp may use \r for progress updates even with --newline on some platforms.
func scanLinesOrCR(data []byte, atEOF bool) (advance int, token []byte, err error) {
	if atEOF && len(data) == 0 {
		return 0, nil, nil
	}
	for i := 0; i < len(data); i++ {
		if data[i] == '\n' {
			line := data[:i]
			if len(line) > 0 && line[len(line)-1] == '\r' {
				line = line[:len(line)-1]
			}
			return i + 1, line, nil
		}
		if data[i] == '\r' {
			if i+1 < len(data) && data[i+1] == '\n' {
				continue
			}
			return i + 1, data[:i], nil
		}
	}
	if atEOF {
		return len(data), data, nil
	}
	return 0, nil, nil
}

