package queue

import (
	"context"
	"fmt"
	"sync"
	"time"

	"ybdownloader/internal/core"
)

// Manager controls the download queue and concurrency.
type Manager struct {
	mu         sync.RWMutex
	items      map[string]*core.QueueItem
	order      []string // Maintains insertion order
	downloader core.Downloader
	settings   func() (*core.Settings, error)
	emit       func(event string, data interface{})

	// Concurrency control
	downloadSlots chan struct{}
	cancelFuncs   map[string]context.CancelFunc
	pendingRemove map[string]bool // Track items to remove after cancellation
}

// New creates a queue manager that handles concurrent downloads.
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
		pendingRemove: make(map[string]bool),
	}
}

// AddItem adds a new item to the queue.
// Returns error if URL already exists in queue.
func (m *Manager) AddItem(id, url string, format core.Format, savePath string) (*core.QueueItem, error) {
	m.mu.Lock()

	// Check for duplicate URL
	for _, item := range m.items {
		if item.URL == url {
			m.mu.Unlock()
			return nil, fmt.Errorf("URL already in queue")
		}
	}

	item := core.NewQueueItem(id, url, format, savePath)
	m.items[id] = item
	m.order = append(m.order, id)
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
	return item, nil
}

// HasURL checks if a URL already exists in the queue.
func (m *Manager) HasURL(url string) bool {
	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, item := range m.items {
		if item.URL == url {
			return true
		}
	}
	return false
}

// RemoveItem removes an item from the queue.
// If the item is actively downloading, it will be cancelled and then removed.
func (m *Manager) RemoveItem(id string) error {
	m.mu.Lock()

	item, exists := m.items[id]
	if !exists {
		m.mu.Unlock()
		return core.ErrQueueItemNotFound
	}

	// Cancel if downloading
	if cancel, ok := m.cancelFuncs[id]; ok {
		// Mark for removal after cancellation completes
		m.pendingRemove[id] = true
		item.State = core.StateCancelRequested
		item.UpdatedAt = time.Now()
		items := m.getAllItemsLocked()
		m.mu.Unlock()

		cancel()
		m.emitQueueUpdate(items)
		return nil
	}

	// Not actively downloading, remove immediately
	delete(m.items, id)
	m.removeFromOrder(id)
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
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
	return m.getAllItemsLocked()
}

// getAllItemsLocked returns all items (caller must hold lock).
func (m *Manager) getAllItemsLocked() []*core.QueueItem {
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
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
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

	item, exists := m.items[id]
	if !exists {
		m.mu.Unlock()
		return core.ErrQueueItemNotFound
	}

	if cancel, ok := m.cancelFuncs[id]; ok {
		item.State = core.StateCancelRequested
		item.UpdatedAt = time.Now()
		items := m.getAllItemsLocked()
		m.mu.Unlock()

		cancel()
		m.emitQueueUpdate(items)
		return nil
	}

	// Not actively downloading, just mark as cancelled
	item.State = core.StateCancelled
	item.UpdatedAt = time.Now()
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
	return nil
}

// CancelAll cancels all active downloads.
func (m *Manager) CancelAll() error {
	m.mu.Lock()

	// Collect all cancel functions first
	cancels := make([]context.CancelFunc, 0, len(m.cancelFuncs))
	for id, cancel := range m.cancelFuncs {
		cancels = append(cancels, cancel)
		if item, ok := m.items[id]; ok {
			item.State = core.StateCancelRequested
			item.UpdatedAt = time.Now()
		}
	}
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	// Cancel outside of lock to prevent deadlock
	for _, cancel := range cancels {
		cancel()
	}

	m.emitQueueUpdate(items)
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
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
	return m.StartDownload(id)
}

// ClearCompleted removes all completed items.
func (m *Manager) ClearCompleted() error {
	m.mu.Lock()

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

	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
	return nil
}

// FetchMetadata fetches metadata for an item.
func (m *Manager) FetchMetadata(ctx context.Context, id string) error {
	m.mu.RLock()
	item, exists := m.items[id]
	if !exists {
		m.mu.RUnlock()
		return core.ErrQueueItemNotFound
	}
	url := item.URL
	m.mu.RUnlock()

	metadata, err := m.downloader.FetchMetadata(ctx, url)
	if err != nil {
		return err
	}

	m.mu.Lock()
	if item, ok := m.items[id]; ok {
		item.Metadata = metadata
		item.UpdatedAt = time.Now()
	}
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
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
	item, exists := m.items[id]
	m.mu.Unlock()

	if !exists {
		cancel()
		return
	}

	defer func() {
		m.mu.Lock()
		delete(m.cancelFuncs, id)

		// Check if pending removal
		if m.pendingRemove[id] {
			delete(m.pendingRemove, id)
			delete(m.items, id)
			m.removeFromOrder(id)
		}
		items := m.getAllItemsLocked()
		m.mu.Unlock()

		m.emitQueueUpdate(items)
	}()

	// Fetch metadata if not present
	if item.Metadata == nil {
		m.updateItemState(id, core.StateFetchingMetadata, "")
		if err := m.FetchMetadata(ctx, id); err != nil {
			if ctx.Err() == context.Canceled {
				m.updateItemState(id, core.StateCancelled, "")
			} else {
				m.updateItemState(id, core.StateFailed, err.Error())
			}
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
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
	m.emit("download:complete", map[string]string{"itemId": id, "filePath": item.FilePath})
}

func (m *Manager) updateItemState(id string, state core.DownloadState, errMsg string) {
	m.mu.Lock()
	if item, ok := m.items[id]; ok {
		item.State = state
		item.Error = errMsg
		item.UpdatedAt = time.Now()
	}
	items := m.getAllItemsLocked()
	m.mu.Unlock()

	m.emitQueueUpdate(items)
}

func (m *Manager) removeFromOrder(id string) {
	for i, oid := range m.order {
		if oid == id {
			m.order = append(m.order[:i], m.order[i+1:]...)
			return
		}
	}
}

func (m *Manager) emitQueueUpdate(items []*core.QueueItem) {
	if m.emit != nil {
		m.emit("queue:updated", items)
	}
}

// GetAllItemsUnsafe returns items without locking (for use when already locked).
//
// Deprecated: Use getAllItemsLocked instead.
func (m *Manager) GetAllItemsUnsafe() []*core.QueueItem {
	return m.getAllItemsLocked()
}

// Shutdown gracefully stops all active downloads.
// Should be called during application shutdown.
func (m *Manager) Shutdown() {
	m.mu.Lock()

	// Cancel all active downloads
	for id, cancel := range m.cancelFuncs {
		cancel()
		if item, ok := m.items[id]; ok {
			item.State = core.StateCancelled
			item.UpdatedAt = time.Now()
		}
	}
	m.cancelFuncs = make(map[string]context.CancelFunc)
	m.pendingRemove = make(map[string]bool)

	m.mu.Unlock()
}

// ActiveDownloadCount returns the number of currently active downloads.
func (m *Manager) ActiveDownloadCount() int {
	m.mu.RLock()
	defer m.mu.RUnlock()

	count := 0
	for _, item := range m.items {
		if item.State.IsActive() {
			count++
		}
	}
	return count
}
