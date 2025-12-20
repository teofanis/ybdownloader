package downloader

import (
	"context"
	"testing"
	"time"

	"ybdownload/internal/core"
)

func TestExtractVideoID(t *testing.T) {
	tests := []struct {
		name    string
		url     string
		want    string
		wantErr bool
	}{
		{
			name: "standard watch URL",
			url:  "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			want: "dQw4w9WgXcQ",
		},
		{
			name: "watch URL without www",
			url:  "https://youtube.com/watch?v=dQw4w9WgXcQ",
			want: "dQw4w9WgXcQ",
		},
		{
			name: "short youtu.be URL",
			url:  "https://youtu.be/dQw4w9WgXcQ",
			want: "dQw4w9WgXcQ",
		},
		{
			name: "shorts URL",
			url:  "https://www.youtube.com/shorts/dQw4w9WgXcQ",
			want: "dQw4w9WgXcQ",
		},
		{
			name: "embed URL",
			url:  "https://www.youtube.com/embed/dQw4w9WgXcQ",
			want: "dQw4w9WgXcQ",
		},
		{
			name: "music.youtube.com URL",
			url:  "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
			want: "dQw4w9WgXcQ",
		},
		{
			name: "URL with extra params",
			url:  "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest&index=1",
			want: "dQw4w9WgXcQ",
		},
		{
			name:    "invalid URL - no video ID",
			url:     "https://www.youtube.com/",
			wantErr: true,
		},
		{
			name:    "invalid URL - random site",
			url:     "https://google.com/watch?v=dQw4w9WgXcQ",
			wantErr: true,
		},
		{
			name:    "empty URL",
			url:     "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ExtractVideoID(tt.url)
			if (err != nil) != tt.wantErr {
				t.Errorf("ExtractVideoID() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("ExtractVideoID() = %v, want %v", got, tt.want)
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

func TestYouTubeClient_FetchMetadata_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	client := NewYouTubeClient()
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Using a well-known, stable video
	metadata, err := client.FetchMetadata(ctx, "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
	if err != nil {
		t.Fatalf("FetchMetadata() error = %v", err)
	}

	if metadata.ID != "dQw4w9WgXcQ" {
		t.Errorf("Expected ID 'dQw4w9WgXcQ', got '%s'", metadata.ID)
	}
	if metadata.Title == "" {
		t.Error("Expected non-empty title")
	}
	if metadata.Author == "" {
		t.Error("Expected non-empty author")
	}
	if metadata.Duration == 0 {
		t.Error("Expected non-zero duration")
	}
}

func TestQualityToBitrate(t *testing.T) {
	tests := []struct {
		quality core.AudioQuality
		want    int
	}{
		{core.AudioQuality128, 128000},
		{core.AudioQuality192, 192000},
		{core.AudioQuality256, 256000},
		{core.AudioQuality320, 320000},
		{"unknown", 192000}, // Default
	}

	for _, tt := range tests {
		t.Run(string(tt.quality), func(t *testing.T) {
			got := qualityToBitrate(tt.quality)
			if got != tt.want {
				t.Errorf("qualityToBitrate(%s) = %v, want %v", tt.quality, got, tt.want)
			}
		})
	}
}

func TestQualityToHeight(t *testing.T) {
	tests := []struct {
		quality core.VideoQuality
		want    int
	}{
		{core.VideoQuality360p, 360},
		{core.VideoQuality480p, 480},
		{core.VideoQuality720p, 720},
		{core.VideoQuality1080p, 1080},
		{core.VideoQualityBest, 4320},
		{"unknown", 720}, // Default
	}

	for _, tt := range tests {
		t.Run(string(tt.quality), func(t *testing.T) {
			got := qualityToHeight(tt.quality)
			if got != tt.want {
				t.Errorf("qualityToHeight(%s) = %v, want %v", tt.quality, got, tt.want)
			}
		})
	}
}

func TestFormatDuration(t *testing.T) {
	tests := []struct {
		duration time.Duration
		want     int64
	}{
		{0, 0},
		{time.Second, 1},
		{time.Minute, 60},
		{time.Hour, 3600},
		{3*time.Minute + 32*time.Second, 212},
	}

	for _, tt := range tests {
		t.Run(tt.duration.String(), func(t *testing.T) {
			got := FormatDuration(tt.duration)
			if got != tt.want {
				t.Errorf("FormatDuration(%v) = %v, want %v", tt.duration, got, tt.want)
			}
		})
	}
}

func TestAbs(t *testing.T) {
	tests := []struct {
		input int
		want  int
	}{
		{0, 0},
		{5, 5},
		{-5, 5},
		{-100, 100},
	}

	for _, tt := range tests {
		got := abs(tt.input)
		if got != tt.want {
			t.Errorf("abs(%d) = %d, want %d", tt.input, got, tt.want)
		}
	}
}
