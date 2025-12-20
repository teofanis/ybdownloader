// Package app provides the Wails application facade.
// This is the thin layer exposed to the frontend.
package app

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"regexp"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"ybdownload/internal/core"
	"ybdownload/internal/infra/fs"
	"ybdownload/internal/infra/settings"
)

// App is the main application struct exposed to the frontend via Wails bindings.
type App struct {
	ctx           context.Context
	fs            core.FileSystem
	settingsStore core.SettingsStore

	// Queue state (will be replaced with proper queue manager in Phase 3)
	queueMu sync.RWMutex
	queue   []*core.QueueItem
}

// New creates a new App instance with dependencies.
func New() (*App, error) {
	filesystem := fs.New()

	store, err := settings.NewStore(filesystem)
	if err != nil {
		return nil, err
	}

	return &App{
		fs:            filesystem,
		settingsStore: store,
		queue:         make([]*core.QueueItem, 0),
	}, nil
}

// Startup is called when the app starts.
// The context is saved for runtime method calls.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// Shutdown is called when the app is closing.
func (a *App) Shutdown(_ context.Context) {
	// Cleanup resources, cancel active downloads, etc.
}

// =============================================================================
// Settings Methods
// =============================================================================

// GetSettings returns the current settings.
func (a *App) GetSettings() (*core.Settings, error) {
	return a.settingsStore.Load()
}

// SaveSettings persists the provided settings.
func (a *App) SaveSettings(s *core.Settings) error {
	return a.settingsStore.Save(s)
}

// ResetSettings resets settings to defaults and returns them.
func (a *App) ResetSettings() (*core.Settings, error) {
	if err := a.settingsStore.Reset(); err != nil {
		return nil, err
	}
	return a.settingsStore.Load()
}

// =============================================================================
// Queue Methods
// =============================================================================

// AddToQueue adds a new URL to the download queue.
func (a *App) AddToQueue(url string, format string) (*core.QueueItem, error) {
	// Validate URL
	if !isValidYouTubeURL(url) {
		return nil, core.ErrInvalidURL
	}

	// Get settings for save path
	s, err := a.settingsStore.Load()
	if err != nil {
		return nil, err
	}

	// Create queue item
	id := generateID()
	item := core.NewQueueItem(id, url, core.Format(format), s.DefaultSavePath)

	a.queueMu.Lock()
	a.queue = append(a.queue, item)
	a.queueMu.Unlock()

	// Emit event to frontend
	a.emitQueueUpdated()

	return item, nil
}

// RemoveFromQueue removes an item from the queue.
func (a *App) RemoveFromQueue(id string) error {
	a.queueMu.Lock()
	defer a.queueMu.Unlock()

	for i, item := range a.queue {
		if item.ID == id {
			a.queue = append(a.queue[:i], a.queue[i+1:]...)
			a.emitQueueUpdated()
			return nil
		}
	}

	return core.ErrQueueItemNotFound
}

// GetQueue returns all items in the queue.
func (a *App) GetQueue() []*core.QueueItem {
	a.queueMu.RLock()
	defer a.queueMu.RUnlock()

	result := make([]*core.QueueItem, len(a.queue))
	copy(result, a.queue)
	return result
}

// StartDownload begins downloading a specific item.
func (a *App) StartDownload(_ string) error {
	// TODO: Implement in Phase 2/3
	return nil
}

// StartAllDownloads begins downloading all queued items.
func (a *App) StartAllDownloads() error {
	// TODO: Implement in Phase 2/3
	return nil
}

// CancelDownload cancels a specific download.
func (a *App) CancelDownload(_ string) error {
	// TODO: Implement in Phase 2/3
	return nil
}

// CancelAllDownloads cancels all active downloads.
func (a *App) CancelAllDownloads() error {
	// TODO: Implement in Phase 2/3
	return nil
}

// RetryDownload retries a failed download.
func (a *App) RetryDownload(_ string) error {
	// TODO: Implement in Phase 2/3
	return nil
}

// ClearCompleted removes all completed items from the queue.
func (a *App) ClearCompleted() error {
	a.queueMu.Lock()
	defer a.queueMu.Unlock()

	filtered := make([]*core.QueueItem, 0, len(a.queue))
	for _, item := range a.queue {
		if item.State != core.StateCompleted {
			filtered = append(filtered, item)
		}
	}
	a.queue = filtered

	a.emitQueueUpdated()
	return nil
}

// =============================================================================
// Metadata Methods
// =============================================================================

// FetchMetadata retrieves video metadata without downloading.
func (a *App) FetchMetadata(_ string) (*core.VideoMetadata, error) {
	// TODO: Implement in Phase 2
	return nil, nil
}

// =============================================================================
// File Dialog Methods
// =============================================================================

// SelectDirectory opens a directory picker dialog and returns the selected path.
func (a *App) SelectDirectory() (string, error) {
	dir, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Download Folder",
	})
	if err != nil {
		return "", err
	}
	return dir, nil
}

// OpenFile opens a file with the system default application.
func (a *App) OpenFile(path string) {
	runtime.BrowserOpenURL(a.ctx, "file://"+path)
}

// OpenFolder opens a folder in the system file manager.
func (a *App) OpenFolder(path string) {
	runtime.BrowserOpenURL(a.ctx, "file://"+path)
}

// =============================================================================
// Helper Methods
// =============================================================================

func (a *App) emitQueueUpdated() {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, "queue:updated", a.queue)
	}
}

// =============================================================================
// Utility Functions
// =============================================================================

func generateID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func isValidYouTubeURL(url string) bool {
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`^(https?://)?(www\.)?youtube\.com/watch\?v=[\w-]{11}`),
		regexp.MustCompile(`^(https?://)?(www\.)?youtu\.be/[\w-]{11}`),
		regexp.MustCompile(`^(https?://)?(www\.)?youtube\.com/shorts/[\w-]{11}`),
		regexp.MustCompile(`^(https?://)?(www\.)?youtube\.com/embed/[\w-]{11}`),
		regexp.MustCompile(`^(https?://)?(music\.)?youtube\.com/watch\?v=[\w-]{11}`),
	}

	for _, pattern := range patterns {
		if pattern.MatchString(url) {
			return true
		}
	}
	return false
}
