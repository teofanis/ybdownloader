package core

import "time"

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

func (s DownloadState) IsTerminal() bool {
	return s == StateCompleted || s == StateFailed || s == StateCancelled
}

func (s DownloadState) IsActive() bool {
	return s == StateFetchingMetadata || s == StateDownloading || s == StateConverting
}

type Format string

const (
	FormatMP3 Format = "mp3"
	FormatM4A Format = "m4a"
	FormatMP4 Format = "mp4"
)

func (f Format) IsAudioOnly() bool {
	return f == FormatMP3 || f == FormatM4A
}

type VideoMetadata struct {
	ID          string        `json:"id"`
	Title       string        `json:"title"`
	Author      string        `json:"author"`
	Duration    time.Duration `json:"duration"`
	Thumbnail   string        `json:"thumbnail"`
	Description string        `json:"description,omitempty"`
}

type DownloadProgress struct {
	ItemID          string        `json:"itemId"`
	State           DownloadState `json:"state"`
	Percent         float64       `json:"percent"`
	DownloadedBytes int64         `json:"downloadedBytes"`
	TotalBytes      int64         `json:"totalBytes"`
	Speed           int64         `json:"speed"`
	ETA             int64         `json:"eta"`
	Error           string        `json:"error,omitempty"`
}

type QueueItem struct {
	ID        string         `json:"id"`
	URL       string         `json:"url"`
	State     DownloadState  `json:"state"`
	Format    Format         `json:"format"`
	Metadata  *VideoMetadata `json:"metadata,omitempty"`
	SavePath  string         `json:"savePath"`
	FilePath  string         `json:"filePath,omitempty"`
	Error     string         `json:"error,omitempty"`
	CreatedAt time.Time      `json:"createdAt"`
	UpdatedAt time.Time      `json:"updatedAt"`
}

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

type AudioQuality string

const (
	AudioQuality128 AudioQuality = "128"
	AudioQuality192 AudioQuality = "192"
	AudioQuality256 AudioQuality = "256"
	AudioQuality320 AudioQuality = "320"
)

type VideoQuality string

const (
	VideoQuality360p  VideoQuality = "360p"
	VideoQuality480p  VideoQuality = "480p"
	VideoQuality720p  VideoQuality = "720p"
	VideoQuality1080p VideoQuality = "1080p"
	VideoQualityBest  VideoQuality = "best"
)
