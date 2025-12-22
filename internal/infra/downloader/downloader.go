package downloader

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"ybdownloader/internal/core"
)

// Downloader implements core.Downloader using YouTube library and FFmpeg.
type Downloader struct {
	youtube  *YouTubeClient
	ffmpeg   *FFmpeg
	fs       core.FileSystem
	settings func() (*core.Settings, error)
}

// Config holds configuration for the downloader.
type Config struct {
	FFmpegPath string
}

// New sets up the downloader with FFmpeg for conversions.
func New(fs core.FileSystem, getSettings func() (*core.Settings, error)) (*Downloader, error) {
	settings, err := getSettings()
	if err != nil {
		return nil, fmt.Errorf("failed to load settings: %w", err)
	}

	ffmpeg, err := NewFFmpeg(settings.FFmpegPath)
	if err != nil {
		// FFmpeg not found, but we can still proceed - just can't convert
		ffmpeg = nil
	}

	return &Downloader{
		youtube:  NewYouTubeClient(),
		ffmpeg:   ffmpeg,
		fs:       fs,
		settings: getSettings,
	}, nil
}

// FetchMetadata retrieves video metadata from YouTube.
func (d *Downloader) FetchMetadata(ctx context.Context, url string) (*core.VideoMetadata, error) {
	return d.youtube.FetchMetadata(ctx, url)
}

// Download downloads a video/audio from YouTube.
func (d *Downloader) Download(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error {
	settings, err := d.settings()
	if err != nil {
		return err
	}

	// Get stream info
	stream, err := d.youtube.SelectStream(ctx, item.URL, item.Format, settings.DefaultAudioQuality, settings.DefaultVideoQuality)
	if err != nil {
		return fmt.Errorf("failed to select stream: %w", err)
	}

	// Prepare output path
	safeTitle := d.fs.SanitizeFilename(stream.Video.Title)
	tempDir, err := d.fs.GetTempDir()
	if err != nil {
		return fmt.Errorf("failed to get temp dir: %w", err)
	}

	// Determine file extensions
	downloadExt := getDownloadExtension(stream.Format.MimeType)
	finalExt := string(item.Format)

	tempPath := filepath.Join(tempDir, fmt.Sprintf("%s_%s.%s", item.ID, safeTitle, downloadExt))
	finalPath := filepath.Join(item.SavePath, fmt.Sprintf("%s.%s", safeTitle, finalExt))

	// Ensure save directory exists
	if err := d.fs.EnsureDir(item.SavePath); err != nil {
		return fmt.Errorf("failed to create save directory: %w", err)
	}

	// Get stream reader
	reader, size, err := d.youtube.GetStream(ctx, stream.Video, stream.Format)
	if err != nil {
		return fmt.Errorf("failed to get stream: %w", err)
	}
	defer reader.Close() //nolint:errcheck // deferred close

	// Create temp file
	tempFile, err := os.Create(tempPath) //nolint:gosec // controlled path
	if err != nil {
		return fmt.Errorf("failed to create temp file: %w", err)
	}
	defer func() {
		_ = tempFile.Close()    //nolint:errcheck // deferred close
		_ = os.Remove(tempPath) //nolint:errcheck // best-effort cleanup
	}()

	// Download with progress tracking
	if err := d.downloadWithProgress(ctx, reader, tempFile, size, item.ID, onProgress); err != nil {
		return err
	}
	_ = tempFile.Close() //nolint:errcheck // already handled in defer

	// Check if conversion is needed
	needsConversion := downloadExt != finalExt || (item.Format.IsAudioOnly() && !stream.IsAudioOnly)

	if needsConversion && d.ffmpeg != nil {
		// Report converting state
		onProgress(core.DownloadProgress{
			ItemID:  item.ID,
			State:   core.StateConverting,
			Percent: 0,
		})

		if err := d.ffmpeg.Convert(ctx, tempPath, finalPath, item.Format, settings.DefaultAudioQuality); err != nil {
			return fmt.Errorf("conversion failed: %w", err)
		}
	} else {
		// No conversion needed or FFmpeg not available - save with native format
		if needsConversion && d.ffmpeg == nil {
			// Adjust final path to use the native extension
			finalPath = filepath.Join(item.SavePath, fmt.Sprintf("%s.%s", safeTitle, downloadExt))
		}

		// Move the file
		if err := os.Rename(tempPath, finalPath); err != nil {
			// If rename fails (cross-device), try copy
			if err := copyFile(tempPath, finalPath); err != nil {
				return fmt.Errorf("failed to move file: %w", err)
			}
		}
	}

	// Update item with final path
	item.FilePath = finalPath

	return nil
}

func (d *Downloader) downloadWithProgress(ctx context.Context, reader io.Reader, writer io.Writer, totalSize int64, itemID string, onProgress func(core.DownloadProgress)) error {
	var downloaded int64
	buffer := make([]byte, 32*1024) // 32KB buffer
	lastReport := time.Now()
	startTime := time.Now()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		n, err := reader.Read(buffer)
		if n > 0 {
			if _, writeErr := writer.Write(buffer[:n]); writeErr != nil {
				return fmt.Errorf("write error: %w", writeErr)
			}
			downloaded += int64(n)

			// Report progress every 100ms
			if time.Since(lastReport) > 100*time.Millisecond {
				elapsed := time.Since(startTime).Seconds()
				speed := int64(0)
				if elapsed > 0 {
					speed = int64(float64(downloaded) / elapsed)
				}

				eta := int64(0)
				if speed > 0 && totalSize > 0 {
					remaining := totalSize - downloaded
					eta = remaining / speed
				}

				percent := float64(0)
				if totalSize > 0 {
					percent = float64(downloaded) / float64(totalSize) * 100
				}

				onProgress(core.DownloadProgress{
					ItemID:          itemID,
					State:           core.StateDownloading,
					Percent:         percent,
					DownloadedBytes: downloaded,
					TotalBytes:      totalSize,
					Speed:           speed,
					ETA:             eta,
				})

				lastReport = time.Now()
			}
		}

		if err == io.EOF {
			break
		}
		if err != nil {
			return fmt.Errorf("read error: %w", err)
		}
	}

	// Final progress report
	onProgress(core.DownloadProgress{
		ItemID:          itemID,
		State:           core.StateDownloading,
		Percent:         100,
		DownloadedBytes: downloaded,
		TotalBytes:      totalSize,
		Speed:           0,
		ETA:             0,
	})

	return nil
}

func getDownloadExtension(mimeType string) string {
	switch {
	case strings.Contains(mimeType, "mp4"):
		return "mp4"
	case strings.Contains(mimeType, "webm"):
		return "webm"
	case strings.Contains(mimeType, "audio/mp4"), strings.Contains(mimeType, "m4a"):
		return "m4a"
	case strings.Contains(mimeType, "audio/webm"):
		return "webm"
	default:
		return "mp4"
	}
}

func copyFile(src, dst string) error {
	in, err := os.Open(src) //nolint:gosec // user-provided path is expected
	if err != nil {
		return err
	}
	defer in.Close() //nolint:errcheck // deferred close

	out, err := os.Create(dst) //nolint:gosec // user-provided path is expected
	if err != nil {
		return err
	}
	defer out.Close() //nolint:errcheck // deferred close

	_, err = io.Copy(out, in)
	return err
}
