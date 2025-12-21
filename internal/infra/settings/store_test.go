package settings

import (
	"os"
	"path/filepath"
	"testing"

	"ybdownload/internal/core"
)

// mockFS is a mock filesystem for testing.
type mockFS struct {
	configDir string
	musicDir  string
}

func (m *mockFS) GetConfigDir() (string, error) {
	return m.configDir, nil
}

func (m *mockFS) GetMusicDir() (string, error) {
	return m.musicDir, nil
}

func (m *mockFS) GetDownloadsDir() (string, error) {
	return filepath.Join(m.configDir, "Downloads"), nil
}

func (m *mockFS) EnsureDir(path string) error {
	return os.MkdirAll(path, 0755)
}

func (m *mockFS) IsWritable(path string) bool {
	return true
}

func (m *mockFS) SanitizeFilename(name string) string {
	return name
}

func (m *mockFS) GetTempDir() (string, error) {
	return os.TempDir(), nil
}

func (m *mockFS) FileExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return !info.IsDir()
}

func (m *mockFS) DirExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}

func newTestStore(t *testing.T) (*Store, string) {
	t.Helper()

	tmpDir := t.TempDir()
	mockFS := &mockFS{
		configDir: tmpDir,
		musicDir:  filepath.Join(tmpDir, "Music"),
	}

	store, err := NewStore(mockFS)
	if err != nil {
		t.Fatalf("NewStore() error = %v", err)
	}

	return store, tmpDir
}

func TestLoadDefaultSettings(t *testing.T) {
	store, tmpDir := newTestStore(t)

	settings, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if settings == nil {
		t.Fatal("Load() returned nil settings")
	}

	// Check defaults
	if settings.DefaultSavePath != filepath.Join(tmpDir, "Music") {
		t.Errorf("DefaultSavePath = %q, want %q", settings.DefaultSavePath, filepath.Join(tmpDir, "Music"))
	}

	if settings.DefaultFormat != core.FormatMP3 {
		t.Errorf("DefaultFormat = %q, want %q", settings.DefaultFormat, core.FormatMP3)
	}

	if settings.MaxConcurrentDownloads != 2 {
		t.Errorf("MaxConcurrentDownloads = %d, want 2", settings.MaxConcurrentDownloads)
	}
}

func TestSaveAndLoad(t *testing.T) {
	store, _ := newTestStore(t)

	// Create custom settings
	custom := &core.Settings{
		Version:                1,
		DefaultSavePath:        "/custom/path",
		DefaultFormat:          core.FormatMP4,
		DefaultAudioQuality:    core.AudioQuality320,
		DefaultVideoQuality:    core.VideoQuality1080p,
		MaxConcurrentDownloads: 3,
	}

	// Save
	err := store.Save(custom)
	if err != nil {
		t.Fatalf("Save() error = %v", err)
	}

	// Clear cache
	store.cache = nil

	// Load
	loaded, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	// Verify
	if loaded.DefaultSavePath != custom.DefaultSavePath {
		t.Errorf("DefaultSavePath = %q, want %q", loaded.DefaultSavePath, custom.DefaultSavePath)
	}

	if loaded.DefaultFormat != custom.DefaultFormat {
		t.Errorf("DefaultFormat = %q, want %q", loaded.DefaultFormat, custom.DefaultFormat)
	}

	if loaded.MaxConcurrentDownloads != custom.MaxConcurrentDownloads {
		t.Errorf("MaxConcurrentDownloads = %d, want %d", loaded.MaxConcurrentDownloads, custom.MaxConcurrentDownloads)
	}
}

func TestReset(t *testing.T) {
	store, tmpDir := newTestStore(t)

	// Save custom settings
	custom := &core.Settings{
		Version:                1,
		DefaultSavePath:        "/custom/path",
		DefaultFormat:          core.FormatMP4,
		MaxConcurrentDownloads: 5,
	}
	if err := store.Save(custom); err != nil {
		t.Fatalf("Save() error = %v", err)
	}

	// Reset
	if err := store.Reset(); err != nil {
		t.Fatalf("Reset() error = %v", err)
	}

	// Load should return defaults
	settings, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if settings.DefaultSavePath != filepath.Join(tmpDir, "Music") {
		t.Errorf("After reset, DefaultSavePath = %q, want default", settings.DefaultSavePath)
	}
}

func TestValidation(t *testing.T) {
	store, _ := newTestStore(t)

	// Test invalid concurrent downloads
	invalid := &core.Settings{
		MaxConcurrentDownloads: 100, // should be clamped to 5
	}

	err := store.Save(invalid)
	if err != nil {
		t.Fatalf("Save() error = %v", err)
	}

	loaded, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	if loaded.MaxConcurrentDownloads > 5 {
		t.Errorf("MaxConcurrentDownloads = %d, should be clamped to 5", loaded.MaxConcurrentDownloads)
	}
}

func TestCaching(t *testing.T) {
	store, _ := newTestStore(t)

	// Load twice, should use cache
	settings1, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	settings2, err := store.Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}

	// Modify one shouldn't affect the other (should be copies)
	settings1.MaxConcurrentDownloads = 99
	if settings2.MaxConcurrentDownloads == 99 {
		t.Error("Settings should be copied, not shared")
	}
}
