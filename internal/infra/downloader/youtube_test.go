package downloader

import (
	"testing"
	"time"

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
