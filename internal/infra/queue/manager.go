package queue

import (
	"context"
	"fmt"
	"sync"
	"time"

	"ybdownload/internal/core"
)

// Manager handles the download queue with concurrency control.
type Manager struct {
	mu         sync.RWMutex
	items      map[string]*core.QueueItem
	order      []string // Maintains insertion order
	downloader core.Downloader
	settings   func() (*core.Settings, error)
	emit       func(event string, data interface{})

	// Concurrency control
	activeDownloads int
	downloadSlots   chan struct{}
	cancelFuncs     map[string]context.CancelFunc
}

// New creates a new queue manager.
func New(downloader core.Downloader, getSettings func() (*core.Settings, error), emit func(string, interface{})) *Manager {
	settings, _ := getSettings()
	maxConcurrent := 2
	if settings != nil {
		maxConcurrent = settings.MaxConcurrentDownloads
	}

	return &Manager{
		items:         make(map[string]*core.QueueItem),
		order:         make([]string, 0),
		downloader:    downloader,
		settings:      getSettings,
		emit:          emit,
		downloadSlots: make(chan struct{}, maxConcurrent),
		cancelFuncs:   make(map[string]context.CancelFunc),
	}
}

// AddItem adds a new item to the queue.
func (m *Manager) AddItem(id, url string, format core.Format, savePath string) (*core.QueueItem, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	item := core.NewQueueItem(id, url, format, savePath)
	m.items[id] = item
	m.order = append(m.order, id)

	m.emitQueueUpdate()
	return item, nil
}

// RemoveItem removes an item from the queue.
func (m *Manager) RemoveItem(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	item, exists := m.items[id]
	if !exists {
		return core.ErrQueueItemNotFound
	}

	// Cancel if downloading
	if cancel, ok := m.cancelFuncs[id]; ok {
		cancel()
		delete(m.cancelFuncs, id)
	}

	// Only remove if not actively downloading, or cancelled
	if item.State.IsActive() {
		item.State = core.StateCancelRequested
		m.emitQueueUpdate()
		return nil
	}

	delete(m.items, id)
	m.removeFromOrder(id)
	m.emitQueueUpdate()
	return nil
}

// GetItem returns a specific queue item.
func (m *Manager) GetItem(id string) (*core.QueueItem, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	item, exists := m.items[id]
	if !exists {
		return nil, core.ErrQueueItemNotFound
	}
	return item, nil
}

// GetAllItems returns all queue items in order.
func (m *Manager) GetAllItems() []*core.QueueItem {
	m.mu.RLock()
	defer m.mu.RUnlock()

	result := make([]*core.QueueItem, 0, len(m.order))
	for _, id := range m.order {
		if item, ok := m.items[id]; ok {
			result = append(result, item)
		}
	}
	return result
}

// StartDownload starts downloading a specific item.
func (m *Manager) StartDownload(id string) error {
	m.mu.Lock()
	item, exists := m.items[id]
	if !exists {
		m.mu.Unlock()
		return core.ErrQueueItemNotFound
	}

	if item.State.IsActive() {
		m.mu.Unlock()
		return nil // Already downloading
	}

	item.State = core.StateFetchingMetadata
	item.UpdatedAt = time.Now()
	m.emitQueueUpdate()
	m.mu.Unlock()

	go m.processDownload(id)
	return nil
}

// StartAll starts all queued items.
func (m *Manager) StartAll() error {
	m.mu.RLock()
	ids := make([]string, 0)
	for _, id := range m.order {
		if item, ok := m.items[id]; ok {
			if item.State == core.StateQueued || item.State == core.StateReady {
				ids = append(ids, id)
			}
		}
	}
	m.mu.RUnlock()

	for _, id := range ids {
		if err := m.StartDownload(id); err != nil {
			// Log but continue with others
			continue
		}
	}
	return nil
}

// CancelItem cancels a specific download.
func (m *Manager) CancelItem(id string) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	item, exists := m.items[id]
	if !exists {
		return core.ErrQueueItemNotFound
	}

	if cancel, ok := m.cancelFuncs[id]; ok {
		cancel()
		delete(m.cancelFuncs, id)
	}

	item.State = core.StateCancelled
	item.UpdatedAt = time.Now()
	m.emitQueueUpdate()
	return nil
}

// CancelAll cancels all active downloads.
func (m *Manager) CancelAll() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	for id, cancel := range m.cancelFuncs {
		cancel()
		delete(m.cancelFuncs, id)
		if item, ok := m.items[id]; ok {
			item.State = core.StateCancelled
			item.UpdatedAt = time.Now()
		}
	}

	m.emitQueueUpdate()
	return nil
}

// RetryItem retries a failed download.
func (m *Manager) RetryItem(id string) error {
	m.mu.Lock()
	item, exists := m.items[id]
	if !exists {
		m.mu.Unlock()
		return core.ErrQueueItemNotFound
	}

	if item.State != core.StateFailed && item.State != core.StateCancelled {
		m.mu.Unlock()
		return fmt.Errorf("item is not in a retryable state")
	}

	item.State = core.StateQueued
	item.Error = ""
	item.UpdatedAt = time.Now()
	m.emitQueueUpdate()
	m.mu.Unlock()

	return m.StartDownload(id)
}

// ClearCompleted removes all completed items.
func (m *Manager) ClearCompleted() error {
	m.mu.Lock()
	defer m.mu.Unlock()

	toRemove := make([]string, 0)
	for _, id := range m.order {
		if item, ok := m.items[id]; ok && item.State == core.StateCompleted {
			toRemove = append(toRemove, id)
		}
	}

	for _, id := range toRemove {
		delete(m.items, id)
		m.removeFromOrder(id)
	}

	m.emitQueueUpdate()
	return nil
}

// FetchMetadata fetches metadata for an item.
func (m *Manager) FetchMetadata(ctx context.Context, id string) error {
	m.mu.Lock()
	item, exists := m.items[id]
	if !exists {
		m.mu.Unlock()
		return core.ErrQueueItemNotFound
	}
	url := item.URL
	m.mu.Unlock()

	metadata, err := m.downloader.FetchMetadata(ctx, url)
	if err != nil {
		return err
	}

	m.mu.Lock()
	if item, ok := m.items[id]; ok {
		item.Metadata = metadata
		item.UpdatedAt = time.Now()
	}
	m.emitQueueUpdate()
	m.mu.Unlock()

	return nil
}

func (m *Manager) processDownload(id string) {
	// Acquire download slot
	m.downloadSlots <- struct{}{}
	defer func() { <-m.downloadSlots }()

	// Create cancellable context
	ctx, cancel := context.WithCancel(context.Background())
	m.mu.Lock()
	m.cancelFuncs[id] = cancel
	m.mu.Unlock()

	defer func() {
		m.mu.Lock()
		delete(m.cancelFuncs, id)
		m.mu.Unlock()
	}()

	m.mu.RLock()
	item, exists := m.items[id]
	m.mu.RUnlock()
	if !exists {
		return
	}

	// Fetch metadata if not present
	if item.Metadata == nil {
		m.updateItemState(id, core.StateFetchingMetadata, "")
		if err := m.FetchMetadata(ctx, id); err != nil {
			m.updateItemState(id, core.StateFailed, err.Error())
			return
		}
	}

	// Start download
	m.updateItemState(id, core.StateDownloading, "")

	err := m.downloader.Download(ctx, item, func(progress core.DownloadProgress) {
		m.emit("download:progress", progress)

		// Update item state from progress
		m.mu.Lock()
		if i, ok := m.items[id]; ok {
			i.State = progress.State
			i.UpdatedAt = time.Now()
		}
		m.mu.Unlock()
	})

	if err != nil {
		if ctx.Err() == context.Canceled {
			m.updateItemState(id, core.StateCancelled, "")
		} else {
			m.updateItemState(id, core.StateFailed, err.Error())
		}
		return
	}

	// Success
	m.mu.Lock()
	if i, ok := m.items[id]; ok {
		i.State = core.StateCompleted
		i.UpdatedAt = time.Now()
	}
	m.emitQueueUpdate()
	m.mu.Unlock()

	m.emit("download:complete", map[string]string{"itemId": id, "filePath": item.FilePath})
}

func (m *Manager) updateItemState(id string, state core.DownloadState, errMsg string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if item, ok := m.items[id]; ok {
		item.State = state
		item.Error = errMsg
		item.UpdatedAt = time.Now()
	}
	m.emitQueueUpdate()
}

func (m *Manager) removeFromOrder(id string) {
	for i, oid := range m.order {
		if oid == id {
			m.order = append(m.order[:i], m.order[i+1:]...)
			return
		}
	}
}

func (m *Manager) emitQueueUpdate() {
	if m.emit != nil {
		m.emit("queue:updated", m.GetAllItemsUnsafe())
	}
}

// GetAllItemsUnsafe returns items without locking (for use when already locked).
func (m *Manager) GetAllItemsUnsafe() []*core.QueueItem {
	result := make([]*core.QueueItem, 0, len(m.order))
	for _, id := range m.order {
		if item, ok := m.items[id]; ok {
			result = append(result, item)
		}
	}
	return result
}
