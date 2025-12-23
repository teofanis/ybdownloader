package downloader

import (
	"testing"
	"time"

	"github.com/kkdai/youtube/v2"

	"ybdownloader/internal/core"
)

func TestExtractVideoID(t *testing.T) {
	tests := []struct {
		name     string
		url      string
		expected string
		wantErr  bool
	}{
		{
			name:     "standard watch URL",
			url:      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			expected: "dQw4w9WgXcQ",
		},
		{
			name:     "watch URL without www",
			url:      "https://youtube.com/watch?v=dQw4w9WgXcQ",
			expected: "dQw4w9WgXcQ",
		},
		{
			name:     "short youtu.be URL",
			url:      "https://youtu.be/dQw4w9WgXcQ",
			expected: "dQw4w9WgXcQ",
		},
		{
			name:     "shorts URL",
			url:      "https://youtube.com/shorts/dQw4w9WgXcQ",
			expected: "dQw4w9WgXcQ",
		},
		{
			name:     "embed URL",
			url:      "https://youtube.com/embed/dQw4w9WgXcQ",
			expected: "dQw4w9WgXcQ",
		},
		{
			name:     "music.youtube URL",
			url:      "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
			expected: "dQw4w9WgXcQ",
		},
		{
			name:     "URL with extra parameters",
			url:      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf",
			expected: "dQw4w9WgXcQ",
		},
		{
			name:    "invalid URL",
			url:     "https://vimeo.com/123456",
			wantErr: true,
		},
		{
			name:    "empty URL",
			url:     "",
			wantErr: true,
		},
		{
			name:    "invalid video ID length",
			url:     "https://youtube.com/watch?v=abc",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := ExtractVideoID(tt.url)
			if tt.wantErr {
				if err == nil {
					t.Error("ExtractVideoID() expected error")
				}
			} else {
				if err != nil {
					t.Errorf("ExtractVideoID() unexpected error = %v", err)
				}
				if result != tt.expected {
					t.Errorf("ExtractVideoID() = %q, want %q", result, tt.expected)
				}
			}
		})
	}
}

func TestNewYouTubeClient(t *testing.T) {
	client := NewYouTubeClient()
	if client == nil {
		t.Error("NewYouTubeClient() returned nil")
	}
}

func TestQualityToBitrate(t *testing.T) {
	tests := []struct {
		quality  core.AudioQuality
		expected int
	}{
		{core.AudioQuality128, 128000},
		{core.AudioQuality192, 192000},
		{core.AudioQuality256, 256000},
		{core.AudioQuality320, 320000},
		{"unknown", 192000}, // default
	}

	for _, tt := range tests {
		result := qualityToBitrate(tt.quality)
		if result != tt.expected {
			t.Errorf("qualityToBitrate(%q) = %d, want %d", tt.quality, result, tt.expected)
		}
	}
}

func TestQualityToHeight(t *testing.T) {
	tests := []struct {
		quality  core.VideoQuality
		expected int
	}{
		{core.VideoQuality360p, 360},
		{core.VideoQuality480p, 480},
		{core.VideoQuality720p, 720},
		{core.VideoQuality1080p, 1080},
		{core.VideoQualityBest, 4320},
		{"unknown", 720}, // default
	}

	for _, tt := range tests {
		result := qualityToHeight(tt.quality)
		if result != tt.expected {
			t.Errorf("qualityToHeight(%q) = %d, want %d", tt.quality, result, tt.expected)
		}
	}
}

func TestAbs(t *testing.T) {
	tests := []struct {
		input    int
		expected int
	}{
		{5, 5},
		{-5, 5},
		{0, 0},
		{-100, 100},
	}

	for _, tt := range tests {
		result := abs(tt.input)
		if result != tt.expected {
			t.Errorf("abs(%d) = %d, want %d", tt.input, result, tt.expected)
		}
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		name     string
		duration time.Duration
		expected int64
	}{
		{"zero", 0, 0},
		{"seconds only", 45 * time.Second, 45},
		{"one minute", 60 * time.Second, 60},
		{"minutes and seconds", 125 * time.Second, 125},
		{"over an hour", 3661 * time.Second, 3661},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := FormatDuration(tt.duration)
			if result != tt.expected {
				t.Errorf("FormatDuration(%v) = %d, want %d", tt.duration, result, tt.expected)
			}
		})
	}
}

func TestStreamInfo_Struct(t *testing.T) {
	info := &StreamInfo{
		Format:      nil,
		Video:       nil,
		ContentSize: 1024000,
		IsAudioOnly: true,
	}

	if info.ContentSize != 1024000 {
		t.Error("ContentSize not set correctly")
	}
	if !info.IsAudioOnly {
		t.Error("IsAudioOnly not set correctly")
	}
}

func TestScoreVideoFormat(t *testing.T) {
	tests := []struct {
		name         string
		format       youtube.Format
		targetHeight int
		minScore     int
	}{
		{
			name:         "exact height match with audio",
			format:       youtube.Format{Height: 720, AudioChannels: 2, AverageBitrate: 2000000},
			targetHeight: 720,
			minScore:     10000, // Should have audio bonus
		},
		{
			name:         "exact height match without audio",
			format:       youtube.Format{Height: 720, AudioChannels: 0, AverageBitrate: 2000000},
			targetHeight: 720,
			minScore:     4000, // No audio bonus
		},
		{
			name:         "higher height than target with audio",
			format:       youtube.Format{Height: 1080, AudioChannels: 2, AverageBitrate: 4000000},
			targetHeight: 720,
			minScore:     10000, // Should still have audio bonus
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			score := scoreVideoFormat(&tt.format, tt.targetHeight)
			if score < tt.minScore {
				t.Errorf("scoreVideoFormat() = %d, want >= %d", score, tt.minScore)
			}
		})
	}
}

func TestScoreVideoFormat_AudioPreference(t *testing.T) {
	// Format with audio should score higher than without
	withAudio := youtube.Format{Height: 720, AudioChannels: 2, AverageBitrate: 1000000}
	withoutAudio := youtube.Format{Height: 720, AudioChannels: 0, AverageBitrate: 1000000}

	scoreWith := scoreVideoFormat(&withAudio, 720)
	scoreWithout := scoreVideoFormat(&withoutAudio, 720)

	if scoreWith <= scoreWithout {
		t.Errorf("format with audio (%d) should score higher than without (%d)", scoreWith, scoreWithout)
	}
}

func TestGetBestThumbnail(t *testing.T) {
	tests := []struct {
		name       string
		thumbnails youtube.Thumbnails
		expected   string
	}{
		{
			name:       "empty thumbnails",
			thumbnails: youtube.Thumbnails{},
			expected:   "",
		},
		{
			name: "single thumbnail",
			thumbnails: youtube.Thumbnails{
				{URL: "https://example.com/thumb1.jpg", Width: 120},
			},
			expected: "https://example.com/thumb1.jpg",
		},
		{
			name: "multiple thumbnails picks largest",
			thumbnails: youtube.Thumbnails{
				{URL: "https://example.com/small.jpg", Width: 120},
				{URL: "https://example.com/large.jpg", Width: 1280},
				{URL: "https://example.com/medium.jpg", Width: 640},
			},
			expected: "https://example.com/large.jpg",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := getBestThumbnail(tt.thumbnails)
			if result != tt.expected {
				t.Errorf("getBestThumbnail() = %q, want %q", result, tt.expected)
			}
		})
	}
}

func TestSelectAudioFormat(t *testing.T) {
	formats := youtube.FormatList{
		{ItagNo: 140, MimeType: "audio/mp4", AverageBitrate: 128000, AudioChannels: 2},
		{ItagNo: 251, MimeType: "audio/webm", AverageBitrate: 160000, AudioChannels: 2},
	}

	tests := []struct {
		name    string
		quality core.AudioQuality
	}{
		{"low quality", core.AudioQuality128},
		{"high quality", core.AudioQuality320},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := selectAudioFormat(formats, tt.quality)
			if result == nil {
				t.Error("selectAudioFormat() returned nil, expected format")
			}
		})
	}
}

func TestSelectAudioFormat_EmptyList(t *testing.T) {
	formats := youtube.FormatList{}
	result := selectAudioFormat(formats, core.AudioQuality192)
	if result != nil {
		t.Error("selectAudioFormat() should return nil for empty list")
	}
}

func TestSelectVideoFormat(t *testing.T) {
	formats := youtube.FormatList{
		{ItagNo: 22, MimeType: "video/mp4", Height: 720, AudioChannels: 2, AverageBitrate: 2000000},
		{ItagNo: 137, MimeType: "video/mp4", Height: 1080, AudioChannels: 0, AverageBitrate: 4000000},
	}

	tests := []struct {
		name    string
		quality core.VideoQuality
	}{
		{"720p", core.VideoQuality720p},
		{"1080p", core.VideoQuality1080p},
		{"best", core.VideoQualityBest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := selectVideoFormat(formats, tt.quality)
			if result == nil {
				t.Error("selectVideoFormat() returned nil, expected format")
			}
		})
	}
}

func TestSelectVideoFormat_EmptyList(t *testing.T) {
	formats := youtube.FormatList{}
	result := selectVideoFormat(formats, core.VideoQuality720p)
	if result != nil {
		t.Error("selectVideoFormat() should return nil for empty list")
	}
}
