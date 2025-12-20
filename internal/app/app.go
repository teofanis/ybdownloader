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

type App struct {
	ctx           context.Context
	fs            core.FileSystem
	settingsStore core.SettingsStore

	queueMu sync.RWMutex
	queue   []*core.QueueItem
}

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

func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) Shutdown(_ context.Context) {}

func (a *App) GetSettings() (*core.Settings, error) {
	return a.settingsStore.Load()
}

func (a *App) SaveSettings(s *core.Settings) error {
	return a.settingsStore.Save(s)
}

func (a *App) ResetSettings() (*core.Settings, error) {
	if err := a.settingsStore.Reset(); err != nil {
		return nil, err
	}
	return a.settingsStore.Load()
}

func (a *App) AddToQueue(url string, format string) (*core.QueueItem, error) {
	if !isValidYouTubeURL(url) {
		return nil, core.ErrInvalidURL
	}

	s, err := a.settingsStore.Load()
	if err != nil {
		return nil, err
	}

	item := core.NewQueueItem(genID(), url, core.Format(format), s.DefaultSavePath)

	a.queueMu.Lock()
	a.queue = append(a.queue, item)
	a.queueMu.Unlock()

	a.emit("queue:updated", a.queue)
	return item, nil
}

func (a *App) RemoveFromQueue(id string) error {
	a.queueMu.Lock()
	defer a.queueMu.Unlock()

	for i, item := range a.queue {
		if item.ID == id {
			a.queue = append(a.queue[:i], a.queue[i+1:]...)
			a.emit("queue:updated", a.queue)
			return nil
		}
	}
	return core.ErrQueueItemNotFound
}

func (a *App) GetQueue() []*core.QueueItem {
	a.queueMu.RLock()
	defer a.queueMu.RUnlock()

	out := make([]*core.QueueItem, len(a.queue))
	copy(out, a.queue)
	return out
}

func (a *App) StartDownload(_ string) error                        { return nil }
func (a *App) StartAllDownloads() error                            { return nil }
func (a *App) CancelDownload(_ string) error                       { return nil }
func (a *App) CancelAllDownloads() error                           { return nil }
func (a *App) RetryDownload(_ string) error                        { return nil }
func (a *App) FetchMetadata(_ string) (*core.VideoMetadata, error) { return nil, nil }

func (a *App) ClearCompleted() error {
	a.queueMu.Lock()
	defer a.queueMu.Unlock()

	filtered := a.queue[:0]
	for _, item := range a.queue {
		if item.State != core.StateCompleted {
			filtered = append(filtered, item)
		}
	}
	a.queue = filtered
	a.emit("queue:updated", a.queue)
	return nil
}

func (a *App) SelectDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Download Folder",
	})
}

func (a *App) OpenFile(path string)   { runtime.BrowserOpenURL(a.ctx, "file://"+path) }
func (a *App) OpenFolder(path string) { runtime.BrowserOpenURL(a.ctx, "file://"+path) }

func (a *App) emit(event string, data interface{}) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, event, data)
	}
}

func genID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b)
}

var ytPatterns = []*regexp.Regexp{
	regexp.MustCompile(`youtube\.com/watch\?v=[\w-]{11}`),
	regexp.MustCompile(`youtu\.be/[\w-]{11}`),
	regexp.MustCompile(`youtube\.com/shorts/[\w-]{11}`),
	regexp.MustCompile(`youtube\.com/embed/[\w-]{11}`),
	regexp.MustCompile(`music\.youtube\.com/watch\?v=[\w-]{11}`),
}

func isValidYouTubeURL(url string) bool {
	for _, p := range ytPatterns {
		if p.MatchString(url) {
			return true
		}
	}
	return false
}
