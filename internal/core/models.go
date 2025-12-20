// Package core contains domain models and business logic interfaces.
package core

import (
	"time"
)

// DownloadState represents the state of a queue item in the download pipeline.
type DownloadState string

const (
	StateQueued           DownloadState = "queued"
	StateFetchingMetadata DownloadState = "fetching_metadata"
	StateReady            DownloadState = "ready"
	StateDownloading      DownloadState = "downloading"
	StateConverting       DownloadState = "converting"
	StateCompleted        DownloadState = "completed"
	StateFailed           DownloadState = "failed"
	StateCancelRequested  DownloadState = "cancel_requested"
	StateCancelled        DownloadState = "cancelled"
)

// IsTerminal returns true if the state is a final state.
func (s DownloadState) IsTerminal() bool {
	return s == StateCompleted || s == StateFailed || s == StateCancelled
}

// IsActive returns true if the state indicates active processing.
func (s DownloadState) IsActive() bool {
	return s == StateFetchingMetadata || s == StateDownloading || s == StateConverting
}

// Format represents the output format for downloads.
type Format string

const (
	FormatMP3 Format = "mp3"
	FormatM4A Format = "m4a"
	FormatMP4 Format = "mp4"
)

// IsAudioOnly returns true if this format is audio-only.
func (f Format) IsAudioOnly() bool {
	return f == FormatMP3 || f == FormatM4A
}

// VideoMetadata contains information about a video fetched from YouTube.
type VideoMetadata struct {
	ID          string        `json:"id"`
	Title       string        `json:"title"`
	Author      string        `json:"author"`
	Duration    time.Duration `json:"duration"`
	Thumbnail   string        `json:"thumbnail"`
	Description string        `json:"description,omitempty"`
}

// DownloadProgress represents the current progress of a download.
type DownloadProgress struct {
	ItemID          string        `json:"itemId"`
	State           DownloadState `json:"state"`
	Percent         float64       `json:"percent"`
	DownloadedBytes int64         `json:"downloadedBytes"`
	TotalBytes      int64         `json:"totalBytes"`
	Speed           int64         `json:"speed"` // bytes per second
	ETA             int64         `json:"eta"`   // seconds remaining
	Error           string        `json:"error,omitempty"`
}

// QueueItem represents a single download item in the queue.
type QueueItem struct {
	ID        string         `json:"id"`
	URL       string         `json:"url"`
	State     DownloadState  `json:"state"`
	Format    Format         `json:"format"`
	Metadata  *VideoMetadata `json:"metadata,omitempty"`
	SavePath  string         `json:"savePath"`
	FilePath  string         `json:"filePath,omitempty"` // final output file path
	Error     string         `json:"error,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
}

// NewQueueItem creates a new queue item with sensible defaults.
func NewQueueItem(id, url string, format Format, savePath string) *QueueItem {
	now := time.Now()
	return &QueueItem{
		ID:        id,
		URL:       url,
		State:     StateQueued,
		Format:    format,
		SavePath:  savePath,
		CreatedAt: now,
		UpdatedAt: now,
	}
}

// AudioQuality represents audio bitrate options.
type AudioQuality string

const (
	AudioQuality128 AudioQuality = "128"
	AudioQuality192 AudioQuality = "192"
	AudioQuality256 AudioQuality = "256"
	AudioQuality320 AudioQuality = "320"
)

// VideoQuality represents video resolution options.
type VideoQuality string

const (
	VideoQuality360p  VideoQuality = "360p"
	VideoQuality480p  VideoQuality = "480p"
	VideoQuality720p  VideoQuality = "720p"
	VideoQuality1080p VideoQuality = "1080p"
	VideoQualityBest  VideoQuality = "best"
)
