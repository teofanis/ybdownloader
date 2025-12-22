package downloader

import (
	"context"
	"fmt"
	"io"
	"regexp"
	"time"

	"github.com/kkdai/youtube/v2"

	"ybdownloader/internal/core"
)

var videoIDPatterns = []*regexp.Regexp{
	regexp.MustCompile(`youtube\.com/watch\?v=([\w-]{11})`),
	regexp.MustCompile(`youtu\.be/([\w-]{11})`),
	regexp.MustCompile(`youtube\.com/shorts/([\w-]{11})`),
	regexp.MustCompile(`youtube\.com/embed/([\w-]{11})`),
	regexp.MustCompile(`music\.youtube\.com/watch\?v=([\w-]{11})`),
}

// YouTubeClient wraps the kkdai/youtube library for video metadata and stream fetching.
type YouTubeClient struct {
	client youtube.Client
}

// NewYouTubeClient creates a new YouTube client instance.
func NewYouTubeClient() *YouTubeClient {
	return &YouTubeClient{
		client: youtube.Client{},
	}
}

// ExtractVideoID extracts the 11-character video ID from a YouTube URL.
func ExtractVideoID(url string) (string, error) {
	for _, p := range videoIDPatterns {
		if matches := p.FindStringSubmatch(url); len(matches) > 1 {
			return matches[1], nil
		}
	}
	return "", fmt.Errorf("could not extract video ID from URL: %s", url)
}

// FetchMetadata retrieves video metadata from YouTube.
func (y *YouTubeClient) FetchMetadata(ctx context.Context, url string) (*core.VideoMetadata, error) {
	videoID, err := ExtractVideoID(url)
	if err != nil {
		return nil, err
	}

	video, err := y.client.GetVideoContext(ctx, videoID)
	if err != nil {
		return nil, fmt.Errorf("failed to get video info: %w", err)
	}

	return &core.VideoMetadata{
		ID:          video.ID,
		Title:       video.Title,
		Author:      video.Author,
		Duration:    video.Duration,
		Thumbnail:   getBestThumbnail(video.Thumbnails),
		Description: video.Description,
	}, nil
}

// StreamInfo contains information about a selected stream for download.
type StreamInfo struct {
	Format      *youtube.Format
	Video       *youtube.Video
	ContentSize int64
	IsAudioOnly bool
}

// SelectStream chooses the best stream based on format preference.
func (y *YouTubeClient) SelectStream(ctx context.Context, url string, format core.Format, audioQuality core.AudioQuality, videoQuality core.VideoQuality) (*StreamInfo, error) {
	videoID, err := ExtractVideoID(url)
	if err != nil {
		return nil, err
	}

	video, err := y.client.GetVideoContext(ctx, videoID)
	if err != nil {
		return nil, fmt.Errorf("failed to get video info: %w", err)
	}

	var selected *youtube.Format
	isAudioOnly := format.IsAudioOnly()

	if isAudioOnly {
		selected = selectAudioFormat(video.Formats, audioQuality)
	} else {
		selected = selectVideoFormat(video.Formats, videoQuality)
	}

	if selected == nil {
		return nil, fmt.Errorf("no suitable format found for %s", format)
	}

	return &StreamInfo{
		Format:      selected,
		Video:       video,
		ContentSize: selected.ContentLength,
		IsAudioOnly: isAudioOnly,
	}, nil
}

// GetStream returns a reader for the video/audio stream.
func (y *YouTubeClient) GetStream(ctx context.Context, video *youtube.Video, format *youtube.Format) (io.ReadCloser, int64, error) {
	stream, size, err := y.client.GetStreamContext(ctx, video, format)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get stream: %w", err)
	}
	return stream, size, nil
}

func selectAudioFormat(formats youtube.FormatList, quality core.AudioQuality) *youtube.Format {
	// Filter to audio-only formats
	audioFormats := formats.Type("audio")
	if len(audioFormats) == 0 {
		return nil
	}

	targetBitrate := qualityToBitrate(quality)

	// Find format closest to target bitrate
	var best *youtube.Format
	var bestDiff int
	for i := range audioFormats {
		f := &audioFormats[i]
		diff := abs(f.AverageBitrate - targetBitrate)
		if best == nil || diff < bestDiff {
			best = f
			bestDiff = diff
		}
	}

	return best
}

func selectVideoFormat(formats youtube.FormatList, quality core.VideoQuality) *youtube.Format {
	// For video, we want formats with both audio and video, or the best video stream
	videoFormats := formats.Type("video")
	if len(videoFormats) == 0 {
		return nil
	}

	targetHeight := qualityToHeight(quality)

	// Find format closest to target height with audio
	var best *youtube.Format
	var bestScore int
	for i := range videoFormats {
		f := &videoFormats[i]
		score := scoreVideoFormat(f, targetHeight)
		if best == nil || score > bestScore {
			best = f
			bestScore = score
		}
	}

	return best
}

func scoreVideoFormat(f *youtube.Format, targetHeight int) int {
	score := 0

	// Prefer formats with audio included
	if f.AudioChannels > 0 {
		score += 10000
	}

	// Prefer height close to target
	heightDiff := abs(f.Height - targetHeight)
	score += 5000 - heightDiff

	// Prefer higher bitrate
	score += f.AverageBitrate / 10000

	return score
}

func qualityToBitrate(q core.AudioQuality) int {
	switch q {
	case core.AudioQuality128:
		return 128000
	case core.AudioQuality192:
		return 192000
	case core.AudioQuality256:
		return 256000
	case core.AudioQuality320:
		return 320000
	default:
		return 192000
	}
}

func qualityToHeight(q core.VideoQuality) int {
	switch q {
	case core.VideoQuality360p:
		return 360
	case core.VideoQuality480p:
		return 480
	case core.VideoQuality720p:
		return 720
	case core.VideoQuality1080p:
		return 1080
	case core.VideoQualityBest:
		return 4320 // 8K, will select highest available
	default:
		return 720
	}
}

func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}

func getBestThumbnail(thumbs youtube.Thumbnails) string {
	if len(thumbs) == 0 {
		return ""
	}

	// Sort by size, prefer larger
	best := thumbs[0]
	for _, t := range thumbs {
		if t.Width > best.Width {
			best = t
		}
	}
	return best.URL
}

// FormatDuration converts duration to seconds for JSON serialization.
func FormatDuration(d time.Duration) int64 {
	return int64(d.Seconds())
}
