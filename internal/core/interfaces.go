package core

import (
	"context"
)

// Downloader defines the interface for downloading videos from YouTube.
type Downloader interface {
	// FetchMetadata retrieves video metadata without downloading.
	FetchMetadata(ctx context.Context, url string) (*VideoMetadata, error)

	// Download downloads a video and converts it to the specified format.
	// Progress updates are sent via the provided callback.
	Download(ctx context.Context, item *QueueItem, onProgress func(DownloadProgress)) error
}

// SettingsStore defines the interface for persisting settings.
type SettingsStore interface {
	// Load reads settings from storage. Returns default settings if none exist.
	Load() (*Settings, error)

	// Save persists settings to storage.
	Save(settings *Settings) error

	// Reset removes all saved settings.
	Reset() error
}

// FileSystem defines platform-aware filesystem operations.
type FileSystem interface {
	// GetConfigDir returns the OS-appropriate config directory for the app.
	GetConfigDir() (string, error)

	// GetMusicDir returns the user's Music directory.
	GetMusicDir() (string, error)

	// GetDownloadsDir returns the user's Downloads directory.
	GetDownloadsDir() (string, error)

	// EnsureDir creates a directory if it doesn't exist.
	EnsureDir(path string) error

	// IsWritable checks if a path is writable.
	IsWritable(path string) bool

	// SanitizeFilename removes invalid characters from a filename.
	SanitizeFilename(name string) string

	// GetTempDir returns a temporary directory for downloads.
	GetTempDir() (string, error)
}

// EventEmitter defines the interface for sending events to the frontend.
type EventEmitter interface {
	// Emit sends an event with the given name and data.
	Emit(eventName string, data interface{})
}

// QueueManager defines the interface for managing the download queue.
type QueueManager interface {
	// AddItem adds a new item to the queue.
	AddItem(url string, format Format) (*QueueItem, error)

	// RemoveItem removes an item from the queue.
	RemoveItem(id string) error

	// GetItem returns a single queue item by ID.
	GetItem(id string) (*QueueItem, error)

	// GetAllItems returns all items in the queue.
	GetAllItems() []*QueueItem

	// StartDownload begins downloading a specific item.
	StartDownload(id string) error

	// StartAll begins downloading all queued items.
	StartAll() error

	// CancelItem requests cancellation of a specific item.
	CancelItem(id string) error

	// CancelAll cancels all active downloads.
	CancelAll() error

	// RetryItem retries a failed item.
	RetryItem(id string) error

	// ClearCompleted removes all completed items from the queue.
	ClearCompleted() error
}
