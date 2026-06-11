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
	GetTempDir() (string, error)
	EnsureDir(path string) error
	FileExists(path string) bool
	DirExists(path string) bool
	IsWritable(path string) bool
	SanitizeFilename(name string) string
}

type EventEmitter interface {
	Emit(eventName string, data interface{})
}

type QueueManager interface {
	AddItem(id, url string, format Format, savePath string) (*QueueItem, error)
	RemoveItem(id string) error
	GetItem(id string) (*QueueItem, error)
	GetAllItems() []*QueueItem
	HasURL(url string) bool
	StartDownload(id string) error
	StartAll() error
	CancelItem(id string) error
	CancelAll() error
	RetryItem(id string) error
	ClearCompleted() error
	FetchMetadata(ctx context.Context, id string) error
	Shutdown()
}

type ConverterService interface {
	GetPresets() []ConversionPreset
	GetPresetsByCategory(category string) []ConversionPreset
	GetPreset(id string) (*ConversionPreset, error)
	AnalyzeFile(ctx context.Context, filePath string) (*MediaInfo, error)
	StartConversion(id, inputPath, outputPath, presetID string, customArgs []string) (*ConversionJob, error)
	StartConversionWithTrim(id, inputPath, outputPath, presetID string, customArgs []string, trim *TrimOptions) (*ConversionJob, error)
	CancelConversion(id string) error
	GetJob(id string) (*ConversionJob, error)
	GetAllJobs() []*ConversionJob
	RemoveJob(id string) error
	ClearCompletedJobs()
	GenerateWaveform(ctx context.Context, filePath string, numSamples int) ([]float64, error)
	GenerateThumbnails(ctx context.Context, filePath string, count int, outputDir string) ([]string, error)
}
