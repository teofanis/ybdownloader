package queue

import (
	"context"
	"sync"
	"testing"
	"time"

	"ybdownloader/internal/core"
)

// mockDownloader implements core.Downloader for testing.
type mockDownloader struct {
	fetchMetadataFunc func(ctx context.Context, url string) (*core.VideoMetadata, error)
	downloadFunc      func(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error
}

func (m *mockDownloader) FetchMetadata(ctx context.Context, url string) (*core.VideoMetadata, error) {
	if m.fetchMetadataFunc != nil {
		return m.fetchMetadataFunc(ctx, url)
	}
	return &core.VideoMetadata{
		ID:       "test123",
		Title:    "Test Video",
		Author:   "Test Author",
		Duration: 180 * time.Second,
	}, nil
}

func (m *mockDownloader) Download(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error {
	if m.downloadFunc != nil {
		return m.downloadFunc(ctx, item, onProgress)
	}
	// Simulate download progress
	for i := 0; i <= 100; i += 20 {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			onProgress(core.DownloadProgress{
				ItemID:  item.ID,
				State:   core.StateDownloading,
				Percent: float64(i),
			})
			time.Sleep(10 * time.Millisecond)
		}
	}
	return nil
}

func defaultSettings() (*core.Settings, error) {
	return &core.Settings{
		MaxConcurrentDownloads: 2,
		DefaultSavePath:        "/tmp/downloads",
	}, nil
}

func TestManager_AddItem(t *testing.T) {
	var events []string
	var mu sync.Mutex
	emit := func(event string, data interface{}) {
		mu.Lock()
		events = append(events, event)
		mu.Unlock()
	}

	m := New(&mockDownloader{}, defaultSettings, emit)

	item, err := m.AddItem("id1", "https://youtube.com/watch?v=test123", core.FormatMP3, "/tmp")
	if err != nil {
		t.Fatalf("AddItem() error = %v", err)
	}

	if item.ID != "id1" {
		t.Errorf("ID = %v, want id1", item.ID)
	}
	if item.State != core.StateQueued {
		t.Errorf("State = %v, want %v", item.State, core.StateQueued)
	}
	if item.Format != core.FormatMP3 {
		t.Errorf("Format = %v, want %v", item.Format, core.FormatMP3)
	}

	// Check event was emitted
	mu.Lock()
	if len(events) != 1 || events[0] != "queue:updated" {
		t.Errorf("Expected queue:updated event, got %v", events)
	}
	mu.Unlock()
}

func TestManager_RemoveItem(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	_, err := m.AddItem("id1", "https://youtube.com/watch?v=test", core.FormatMP3, "/tmp")
	if err != nil {
		t.Fatalf("AddItem() error = %v", err)
	}

	err = m.RemoveItem("id1")
	if err != nil {
		t.Fatalf("RemoveItem() error = %v", err)
	}

	items := m.GetAllItems()
	if len(items) != 0 {
		t.Errorf("Expected empty queue, got %d items", len(items))
	}
}

func TestManager_RemoveItem_NotFound(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	err := m.RemoveItem("nonexistent")
	if err != core.ErrQueueItemNotFound {
		t.Errorf("Expected ErrQueueItemNotFound, got %v", err)
	}
}

func TestManager_GetItem(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	_, err := m.AddItem("id1", "https://youtube.com/watch?v=test", core.FormatMP3, "/tmp")
	if err != nil {
		t.Fatalf("AddItem() error = %v", err)
	}

	item, err := m.GetItem("id1")
	if err != nil {
		t.Fatalf("GetItem() error = %v", err)
	}
	if item.ID != "id1" {
		t.Errorf("ID = %v, want id1", item.ID)
	}
}

func TestManager_GetItem_NotFound(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	_, err := m.GetItem("nonexistent")
	if err != core.ErrQueueItemNotFound {
		t.Errorf("Expected ErrQueueItemNotFound, got %v", err)
	}
}

func TestManager_GetAllItems_Order(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	m.AddItem("id1", "https://youtube.com/watch?v=test1", core.FormatMP3, "/tmp")
	m.AddItem("id2", "https://youtube.com/watch?v=test2", core.FormatM4A, "/tmp")
	m.AddItem("id3", "https://youtube.com/watch?v=test3", core.FormatMP4, "/tmp")

	items := m.GetAllItems()
	if len(items) != 3 {
		t.Fatalf("Expected 3 items, got %d", len(items))
	}

	// Check order is maintained
	if items[0].ID != "id1" || items[1].ID != "id2" || items[2].ID != "id3" {
		t.Error("Items not in insertion order")
	}
}

func TestManager_ClearCompleted(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	m.AddItem("id1", "https://youtube.com/watch?v=test1", core.FormatMP3, "/tmp")
	m.AddItem("id2", "https://youtube.com/watch?v=test2", core.FormatMP3, "/tmp")
	m.AddItem("id3", "https://youtube.com/watch?v=test3", core.FormatMP3, "/tmp")

	// Mark some as completed
	m.mu.Lock()
	m.items["id1"].State = core.StateCompleted
	m.items["id3"].State = core.StateCompleted
	m.mu.Unlock()

	err := m.ClearCompleted()
	if err != nil {
		t.Fatalf("ClearCompleted() error = %v", err)
	}

	items := m.GetAllItems()
	if len(items) != 1 {
		t.Fatalf("Expected 1 item, got %d", len(items))
	}
	if items[0].ID != "id2" {
		t.Errorf("Expected id2 to remain, got %s", items[0].ID)
	}
}

func TestManager_CancelItem(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	m.AddItem("id1", "https://youtube.com/watch?v=test", core.FormatMP3, "/tmp")

	err := m.CancelItem("id1")
	if err != nil {
		t.Fatalf("CancelItem() error = %v", err)
	}

	item, _ := m.GetItem("id1")
	if item.State != core.StateCancelled {
		t.Errorf("State = %v, want %v", item.State, core.StateCancelled)
	}
}

func TestManager_CancelAll(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	m.AddItem("id1", "https://youtube.com/watch?v=test1", core.FormatMP3, "/tmp")
	m.AddItem("id2", "https://youtube.com/watch?v=test2", core.FormatMP3, "/tmp")

	err := m.CancelAll()
	if err != nil {
		t.Fatalf("CancelAll() error = %v", err)
	}

	// CancelAll only affects items with active cancel funcs
	// Items that weren't started won't be affected
}

func TestManager_RetryItem(t *testing.T) {
	var downloadCalled sync.WaitGroup
	downloadCalled.Add(1)

	mock := &mockDownloader{
		downloadFunc: func(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error {
			downloadCalled.Done()
			return nil
		},
	}

	m := New(mock, defaultSettings, func(string, interface{}) {})

	m.AddItem("id1", "https://youtube.com/watch?v=test", core.FormatMP3, "/tmp")

	// Set to failed state
	m.mu.Lock()
	m.items["id1"].State = core.StateFailed
	m.mu.Unlock()

	err := m.RetryItem("id1")
	if err != nil {
		t.Fatalf("RetryItem() error = %v", err)
	}

	// Wait for download to be called (with timeout)
	done := make(chan struct{})
	go func() {
		downloadCalled.Wait()
		close(done)
	}()

	select {
	case <-done:
		// Success - download was called
	case <-time.After(1 * time.Second):
		t.Error("Expected download to be called after retry")
	}
}

func TestManager_RetryItem_NotRetryable(t *testing.T) {
	m := New(&mockDownloader{}, defaultSettings, func(string, interface{}) {})

	m.AddItem("id1", "https://youtube.com/watch?v=test", core.FormatMP3, "/tmp")

	// Item is in queued state, not retryable
	err := m.RetryItem("id1")
	if err == nil {
		t.Error("Expected error for non-retryable item")
	}
}

func TestManager_StartDownload(t *testing.T) {
	progressUpdates := make([]core.DownloadProgress, 0)
	var mu sync.Mutex

	mock := &mockDownloader{
		downloadFunc: func(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error {
			for i := 0; i <= 100; i += 50 {
				onProgress(core.DownloadProgress{
					ItemID:  item.ID,
					State:   core.StateDownloading,
					Percent: float64(i),
				})
			}
			return nil
		},
	}

	emit := func(event string, data interface{}) {
		if event == "download:progress" {
			mu.Lock()
			if p, ok := data.(core.DownloadProgress); ok {
				progressUpdates = append(progressUpdates, p)
			}
			mu.Unlock()
		}
	}

	m := New(mock, defaultSettings, emit)
	m.AddItem("id1", "https://youtube.com/watch?v=test", core.FormatMP3, "/tmp")

	err := m.StartDownload("id1")
	if err != nil {
		t.Fatalf("StartDownload() error = %v", err)
	}

	// Wait for download to complete
	time.Sleep(200 * time.Millisecond)

	mu.Lock()
	if len(progressUpdates) == 0 {
		t.Error("Expected progress updates")
	}
	mu.Unlock()
}

func TestManager_StartAll(t *testing.T) {
	var startedCount int
	var mu sync.Mutex

	mock := &mockDownloader{
		downloadFunc: func(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error {
			mu.Lock()
			startedCount++
			mu.Unlock()
			time.Sleep(50 * time.Millisecond)
			return nil
		},
	}

	m := New(mock, defaultSettings, func(string, interface{}) {})

	m.AddItem("id1", "https://youtube.com/watch?v=test1", core.FormatMP3, "/tmp")
	m.AddItem("id2", "https://youtube.com/watch?v=test2", core.FormatMP3, "/tmp")
	m.AddItem("id3", "https://youtube.com/watch?v=test3", core.FormatMP3, "/tmp")

	err := m.StartAll()
	if err != nil {
		t.Fatalf("StartAll() error = %v", err)
	}

	// Wait for all downloads to complete
	time.Sleep(500 * time.Millisecond)

	mu.Lock()
	if startedCount != 3 {
		t.Errorf("Expected 3 downloads started, got %d", startedCount)
	}
	mu.Unlock()
}

func TestManager_Concurrency(t *testing.T) {
	var activeCount int
	var maxActive int
	var mu sync.Mutex

	mock := &mockDownloader{
		downloadFunc: func(ctx context.Context, item *core.QueueItem, onProgress func(core.DownloadProgress)) error {
			mu.Lock()
			activeCount++
			if activeCount > maxActive {
				maxActive = activeCount
			}
			mu.Unlock()

			time.Sleep(100 * time.Millisecond)

			mu.Lock()
			activeCount--
			mu.Unlock()
			return nil
		},
	}

	// Settings with max 2 concurrent downloads
	m := New(mock, defaultSettings, func(string, interface{}) {})

	// Add 5 items
	for i := 0; i < 5; i++ {
		m.AddItem(
			string(rune('a'+i)),
			"https://youtube.com/watch?v=test",
			core.FormatMP3,
			"/tmp",
		)
	}

	m.StartAll()

	// Wait for all to complete
	time.Sleep(1 * time.Second)

	mu.Lock()
	if maxActive > 2 {
		t.Errorf("Max concurrent downloads exceeded: got %d, want <= 2", maxActive)
	}
	mu.Unlock()
}
