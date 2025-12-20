package core

import "context"

type Downloader interface {
	FetchMetadata(ctx context.Context, url string) (*VideoMetadata, error)
	Download(ctx context.Context, item *QueueItem, onProgress func(DownloadProgress)) error
}

type SettingsStore interface {
	Load() (*Settings, error)
	Save(settings *Settings) error
	Reset() error
}

type FileSystem interface {
	GetConfigDir() (string, error)
	GetMusicDir() (string, error)
	GetDownloadsDir() (string, error)
	EnsureDir(path string) error
	IsWritable(path string) bool
	SanitizeFilename(name string) string
	GetTempDir() (string, error)
}

type EventEmitter interface {
	Emit(eventName string, data interface{})
}

type QueueManager interface {
	AddItem(url string, format Format) (*QueueItem, error)
	RemoveItem(id string) error
	GetItem(id string) (*QueueItem, error)
	GetAllItems() []*QueueItem
	StartDownload(id string) error
	StartAll() error
	CancelItem(id string) error
	CancelAll() error
	RetryItem(id string) error
	ClearCompleted() error
}
