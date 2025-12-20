package core

import (
	"testing"
	"time"
)

func TestDownloadState_IsTerminal(t *testing.T) {
	tests := []struct {
		state DownloadState
		want  bool
	}{
		{StateQueued, false},
		{StateFetchingMetadata, false},
		{StateReady, false},
		{StateDownloading, false},
		{StateConverting, false},
		{StateCompleted, true},
		{StateFailed, true},
		{StateCancelRequested, false},
		{StateCancelled, true},
	}

	for _, tt := range tests {
		t.Run(string(tt.state), func(t *testing.T) {
			if got := tt.state.IsTerminal(); got != tt.want {
				t.Errorf("IsTerminal() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestDownloadState_IsActive(t *testing.T) {
	tests := []struct {
		state DownloadState
		want  bool
	}{
		{StateQueued, false},
		{StateFetchingMetadata, true},
		{StateReady, false},
		{StateDownloading, true},
		{StateConverting, true},
		{StateCompleted, false},
		{StateFailed, false},
		{StateCancelRequested, false},
		{StateCancelled, false},
	}

	for _, tt := range tests {
		t.Run(string(tt.state), func(t *testing.T) {
			if got := tt.state.IsActive(); got != tt.want {
				t.Errorf("IsActive() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestFormat_IsAudioOnly(t *testing.T) {
	tests := []struct {
		format Format
		want   bool
	}{
		{FormatMP3, true},
		{FormatM4A, true},
		{FormatMP4, false},
	}

	for _, tt := range tests {
		t.Run(string(tt.format), func(t *testing.T) {
			if got := tt.format.IsAudioOnly(); got != tt.want {
				t.Errorf("IsAudioOnly() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestNewQueueItem(t *testing.T) {
	before := time.Now()
	item := NewQueueItem("test-id", "https://youtube.com/watch?v=test", FormatMP3, "/downloads")
	after := time.Now()

	if item.ID != "test-id" {
		t.Errorf("ID = %v, want test-id", item.ID)
	}
	if item.URL != "https://youtube.com/watch?v=test" {
		t.Errorf("URL = %v, want https://youtube.com/watch?v=test", item.URL)
	}
	if item.State != StateQueued {
		t.Errorf("State = %v, want %v", item.State, StateQueued)
	}
	if item.Format != FormatMP3 {
		t.Errorf("Format = %v, want %v", item.Format, FormatMP3)
	}
	if item.SavePath != "/downloads" {
		t.Errorf("SavePath = %v, want /downloads", item.SavePath)
	}
	if item.CreatedAt.Before(before) || item.CreatedAt.After(after) {
		t.Errorf("CreatedAt not in expected range")
	}
	if item.UpdatedAt.Before(before) || item.UpdatedAt.After(after) {
		t.Errorf("UpdatedAt not in expected range")
	}
	if item.Metadata != nil {
		t.Error("Metadata should be nil initially")
	}
	if item.FilePath != "" {
		t.Error("FilePath should be empty initially")
	}
	if item.Error != "" {
		t.Error("Error should be empty initially")
	}
}

func TestAudioQuality_Values(t *testing.T) {
	qualities := []AudioQuality{
		AudioQuality128,
		AudioQuality192,
		AudioQuality256,
		AudioQuality320,
	}

	expected := []string{"128", "192", "256", "320"}

	for i, q := range qualities {
		if string(q) != expected[i] {
			t.Errorf("AudioQuality = %v, want %v", q, expected[i])
		}
	}
}

func TestVideoQuality_Values(t *testing.T) {
	qualities := []VideoQuality{
		VideoQuality360p,
		VideoQuality480p,
		VideoQuality720p,
		VideoQuality1080p,
		VideoQualityBest,
	}

	expected := []string{"360p", "480p", "720p", "1080p", "best"}

	for i, q := range qualities {
		if string(q) != expected[i] {
			t.Errorf("VideoQuality = %v, want %v", q, expected[i])
		}
	}
}
