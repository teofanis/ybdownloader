package app

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"regexp"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"ybdownload/internal/core"
	"ybdownload/internal/infra/downloader"
	"ybdownload/internal/infra/fs"
	"ybdownload/internal/infra/queue"
	"ybdownload/internal/infra/settings"
)

// App is the main application struct exposed to the frontend via Wails.
type App struct {
	ctx           context.Context
	fs            core.FileSystem
	settingsStore core.SettingsStore
	downloader    core.Downloader
	queueManager  *queue.Manager
}

// New creates a new App instance with all dependencies initialized.
func New() (*App, error) {
	filesystem := fs.New()
	store, err := settings.NewStore(filesystem)
	if err != nil {
		return nil, err
	}

	getSettings := func() (*core.Settings, error) {
		return store.Load()
	}

	dl, err := downloader.New(filesystem, getSettings)
	if err != nil {
		// Log warning but continue - downloader may work partially
		dl = nil
	}

	app := &App{
		fs:            filesystem,
		settingsStore: store,
		downloader:    dl,
	}

	// Queue manager needs emit function, will be set after ctx is available
	return app, nil
}

// Startup is called when the Wails app starts.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize queue manager with emit function
	if a.downloader != nil {
		a.queueManager = queue.New(a.downloader, a.settingsStore.Load, a.emit)
	}
}

// Shutdown is called when the app is closing.
func (a *App) Shutdown(_ context.Context) {}

// GetSettings returns the current application settings.
func (a *App) GetSettings() (*core.Settings, error) {
	return a.settingsStore.Load()
}

// SaveSettings saves the provided settings.
func (a *App) SaveSettings(s *core.Settings) error {
	return a.settingsStore.Save(s)
}

// ResetSettings resets settings to defaults and returns the new settings.
func (a *App) ResetSettings() (*core.Settings, error) {
	if err := a.settingsStore.Reset(); err != nil {
		return nil, err
	}
	return a.settingsStore.Load()
}

// AddToQueue adds a new URL to the download queue.
func (a *App) AddToQueue(url string, format string) (*core.QueueItem, error) {
	if !isValidYouTubeURL(url) {
		return nil, core.ErrInvalidURL
	}

	s, err := a.settingsStore.Load()
	if err != nil {
		return nil, err
	}

	if a.queueManager == nil {
		return nil, core.NewAppError(core.ErrCodeDownloadFailed, "Downloader not initialized", nil)
	}

	return a.queueManager.AddItem(genID(), url, core.Format(format), s.DefaultSavePath)
}

// RemoveFromQueue removes an item from the queue.
func (a *App) RemoveFromQueue(id string) error {
	if a.queueManager == nil {
		return core.ErrQueueItemNotFound
	}
	return a.queueManager.RemoveItem(id)
}

// GetQueue returns all queue items.
func (a *App) GetQueue() []*core.QueueItem {
	if a.queueManager == nil {
		return []*core.QueueItem{}
	}
	return a.queueManager.GetAllItems()
}

// StartDownload starts downloading a specific item.
func (a *App) StartDownload(id string) error {
	if a.queueManager == nil {
		return core.NewAppError(core.ErrCodeDownloadFailed, "Downloader not initialized", nil)
	}
	return a.queueManager.StartDownload(id)
}

// StartAllDownloads starts all pending downloads.
func (a *App) StartAllDownloads() error {
	if a.queueManager == nil {
		return core.NewAppError(core.ErrCodeDownloadFailed, "Downloader not initialized", nil)
	}
	return a.queueManager.StartAll()
}

// CancelDownload cancels a specific download.
func (a *App) CancelDownload(id string) error {
	if a.queueManager == nil {
		return core.ErrQueueItemNotFound
	}
	return a.queueManager.CancelItem(id)
}

// CancelAllDownloads cancels all active downloads.
func (a *App) CancelAllDownloads() error {
	if a.queueManager == nil {
		return nil
	}
	return a.queueManager.CancelAll()
}

// RetryDownload retries a failed download.
func (a *App) RetryDownload(id string) error {
	if a.queueManager == nil {
		return core.ErrQueueItemNotFound
	}
	return a.queueManager.RetryItem(id)
}

// ClearCompleted removes all completed items from the queue.
func (a *App) ClearCompleted() error {
	if a.queueManager == nil {
		return nil
	}
	return a.queueManager.ClearCompleted()
}

// FetchMetadata fetches video metadata for a URL.
func (a *App) FetchMetadata(url string) (*core.VideoMetadata, error) {
	if a.downloader == nil {
		return nil, core.NewAppError(core.ErrCodeDownloadFailed, "Downloader not initialized", nil)
	}
	return a.downloader.FetchMetadata(a.ctx, url)
}

// SelectDirectory opens a native directory picker dialog.
func (a *App) SelectDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Download Folder",
	})
}

// OpenFile opens a file with the default system application.
func (a *App) OpenFile(path string) {
	runtime.BrowserOpenURL(a.ctx, "file://"+path)
}

// OpenFolder opens a folder in the system file manager.
func (a *App) OpenFolder(path string) {
	runtime.BrowserOpenURL(a.ctx, "file://"+path)
}

// CheckFFmpeg checks if FFmpeg is available.
func (a *App) CheckFFmpeg() (bool, string) {
	if !downloader.IsFFmpegInstalled() {
		return false, ""
	}

	ffmpeg, err := downloader.NewFFmpeg("")
	if err != nil {
		return false, ""
	}

	version, _ := ffmpeg.GetVersion(context.Background())
	return true, version
}

// emit sends an event to the frontend.
func (a *App) emit(event string, data interface{}) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, event, data)
	}
}

// genID generates a unique ID for queue items.
func genID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// YouTube URL validation patterns.
var ytPatterns = []*regexp.Regexp{
	regexp.MustCompile(`youtube\.com/watch\?v=[\w-]{11}`),
	regexp.MustCompile(`youtu\.be/[\w-]{11}`),
	regexp.MustCompile(`youtube\.com/shorts/[\w-]{11}`),
	regexp.MustCompile(`youtube\.com/embed/[\w-]{11}`),
	regexp.MustCompile(`music\.youtube\.com/watch\?v=[\w-]{11}`),
}

// isValidYouTubeURL checks if a URL is a valid YouTube video URL.
func isValidYouTubeURL(url string) bool {
	for _, p := range ytPatterns {
		if p.MatchString(url) {
			return true
		}
	}
	return false
}
