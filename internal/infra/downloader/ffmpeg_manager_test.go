package downloader

import (
	"archive/zip"
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"runtime"
	"testing"
	"time"

	"ybdownload/internal/core"
)

// mockFileSystem implements core.FileSystem for testing.
type mockFileSystem struct {
	existingFiles map[string]bool
	existingDirs  map[string]bool
	configDir     string
	tempDir       string
}

func newMockFileSystem() *mockFileSystem {
	return &mockFileSystem{
		existingFiles: make(map[string]bool),
		existingDirs:  make(map[string]bool),
		configDir:     "/mock/config",
		tempDir:       os.TempDir(),
	}
}

func (m *mockFileSystem) EnsureDir(path string) error {
	return nil
}

func (m *mockFileSystem) FileExists(path string) bool {
	return m.existingFiles[path]
}

func (m *mockFileSystem) DirExists(path string) bool {
	return m.existingDirs[path]
}

func (m *mockFileSystem) IsWritable(path string) bool {
	return true
}

func (m *mockFileSystem) SanitizeFilename(name string) string {
	return name
}

func (m *mockFileSystem) GetConfigDir() (string, error) {
	return m.configDir, nil
}

func (m *mockFileSystem) GetTempDir() (string, error) {
	return m.tempDir, nil
}

func (m *mockFileSystem) GetMusicDir() (string, error) {
	return "/mock/music", nil
}

func (m *mockFileSystem) GetDownloadsDir() (string, error) {
	return "/mock/downloads", nil
}

func (m *mockFileSystem) WriteFile(path string, data []byte) error {
	return nil
}

func (m *mockFileSystem) ReadFile(path string) ([]byte, error) {
	return nil, os.ErrNotExist
}

func (m *mockFileSystem) setFileExists(path string, exists bool) {
	m.existingFiles[path] = exists
}

func TestFFmpegManager_GetDownloadURL(t *testing.T) {
	fs := newMockFileSystem()
	settings := &core.Settings{}
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return settings, nil
	}, func(*core.Settings) error { return nil })

	url, archiveType := manager.getDownloadURL()

	switch runtime.GOOS {
	case "windows":
		if runtime.GOARCH == "amd64" {
			expectedURL := "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
			if url != expectedURL {
				t.Errorf("Windows amd64 URL = %q, want %q", url, expectedURL)
			}
			if archiveType != ".zip" {
				t.Errorf("Windows archive type = %q, want .zip", archiveType)
			}
		}
	case "linux":
		switch runtime.GOARCH {
		case "amd64":
			expectedURL := "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz"
			if url != expectedURL {
				t.Errorf("Linux amd64 URL = %q, want %q", url, expectedURL)
			}
			if archiveType != ".tar.xz" {
				t.Errorf("Linux amd64 archive type = %q, want .tar.xz", archiveType)
			}
		case "arm64":
			expectedURL := "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linuxarm64-gpl.tar.xz"
			if url != expectedURL {
				t.Errorf("Linux arm64 URL = %q, want %q", url, expectedURL)
			}
			if archiveType != ".tar.xz" {
				t.Errorf("Linux arm64 archive type = %q, want .tar.xz", archiveType)
			}
		}
	case "darwin":
		// macOS uses evermeet.cx
		if !strContains(url, "evermeet.cx") {
			t.Errorf("macOS URL should use evermeet.cx, got %q", url)
		}
		if archiveType != ".zip" {
			t.Errorf("macOS archive type = %q, want .zip", archiveType)
		}
	}
}

func TestFFmpegManager_GetDownloadURL_ValidURLs(t *testing.T) {
	// Verify that all download URLs are syntactically correct
	tests := []struct {
		name     string
		goos     string
		goarch   string
		wantURL  string
		wantType string
	}{
		{
			name:     "Windows amd64",
			goos:     "windows",
			goarch:   "amd64",
			wantURL:  "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip",
			wantType: ".zip",
		},
		{
			name:     "Linux amd64",
			goos:     "linux",
			goarch:   "amd64",
			wantURL:  "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz",
			wantType: ".tar.xz",
		},
		{
			name:     "Linux arm64",
			goos:     "linux",
			goarch:   "arm64",
			wantURL:  "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linuxarm64-gpl.tar.xz",
			wantType: ".tar.xz",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// We can only run this for the current platform
			if runtime.GOOS == tt.goos && runtime.GOARCH == tt.goarch {
				fs := newMockFileSystem()
				manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
					return &core.Settings{}, nil
				}, func(*core.Settings) error { return nil })

				url, archiveType := manager.getDownloadURL()
				if url != tt.wantURL {
					t.Errorf("URL = %q, want %q", url, tt.wantURL)
				}
				if archiveType != tt.wantType {
					t.Errorf("archiveType = %q, want %q", archiveType, tt.wantType)
				}
			}
		})
	}
}

func TestFFmpegManager_GetFFmpegPath_UserConfigured(t *testing.T) {
	fs := newMockFileSystem()
	customPath := "/custom/ffmpeg"
	fs.setFileExists(customPath, true)

	settings := &core.Settings{FFmpegPath: customPath}
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return settings, nil
	}, func(*core.Settings) error { return nil })

	path, err := manager.GetFFmpegPath()
	if err != nil {
		t.Fatalf("GetFFmpegPath() error = %v", err)
	}

	if path != customPath {
		t.Errorf("GetFFmpegPath() = %q, want %q", path, customPath)
	}
}

func TestFFmpegManager_GetFFmpegPath_Bundled(t *testing.T) {
	fs := newMockFileSystem()

	// Set bundled path to exist
	bundledPath := filepath.Join(fs.configDir, "bin", "ffmpeg")
	if runtime.GOOS == "windows" {
		bundledPath = filepath.Join(fs.configDir, "bin", "ffmpeg.exe")
	}
	fs.setFileExists(bundledPath, true)

	settings := &core.Settings{FFmpegPath: ""} // No custom path
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return settings, nil
	}, func(*core.Settings) error { return nil })

	path, err := manager.GetFFmpegPath()
	if err != nil {
		t.Fatalf("GetFFmpegPath() error = %v", err)
	}

	if path != bundledPath {
		t.Errorf("GetFFmpegPath() = %q, want %q", path, bundledPath)
	}
}

func TestFFmpegManager_GetFFmpegPath_SystemFallback(t *testing.T) {
	if !IsFFmpegInstalled() {
		t.Skip("System FFmpeg not available, skipping test")
	}

	fs := newMockFileSystem()
	settings := &core.Settings{FFmpegPath: ""} // No custom path
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return settings, nil
	}, func(*core.Settings) error { return nil })

	path, err := manager.GetFFmpegPath()
	if err != nil {
		t.Fatalf("GetFFmpegPath() error = %v", err)
	}

	if path == "" {
		t.Error("GetFFmpegPath() returned empty string")
	}
}

func TestFFmpegManager_GetFFmpegPath_NotFound(t *testing.T) {
	// Create a mock that has no FFmpeg anywhere
	fs := newMockFileSystem()
	settings := &core.Settings{FFmpegPath: ""} // No custom path
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return settings, nil
	}, func(*core.Settings) error { return nil })

	// If system FFmpeg is installed, this test isn't applicable
	if IsFFmpegInstalled() {
		t.Skip("System FFmpeg is installed, test not applicable")
	}

	_, err := manager.GetFFmpegPath()
	if err == nil {
		t.Error("GetFFmpegPath() expected error, got nil")
	}
}

func TestFFmpegManager_EnsureFFmpeg_AlreadyAvailable(t *testing.T) {
	if !IsFFmpegInstalled() {
		t.Skip("System FFmpeg not available, skipping test")
	}

	fs := newMockFileSystem()
	settings := &core.Settings{}
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return settings, nil
	}, func(*core.Settings) error { return nil })

	ctx := context.Background()
	progressCalled := false
	err := manager.EnsureFFmpeg(ctx, func(percent float64, status string) {
		progressCalled = true
	})

	if err != nil {
		t.Fatalf("EnsureFFmpeg() error = %v", err)
	}

	// Progress should NOT be called since FFmpeg is already available
	if progressCalled {
		t.Error("Progress callback was called even though FFmpeg is already available")
	}
}

func TestFFmpegManager_DownloadFile_Success(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping network test in short mode")
	}

	// Create a test server that returns mock data
	content := []byte("mock ffmpeg binary content")
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", fmt.Sprintf("%d", len(content)))
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(content)
	}))
	defer server.Close()

	fs := newMockFileSystem()
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}, func(*core.Settings) error { return nil })

	tmpFile := filepath.Join(t.TempDir(), "test-download")

	var lastPercent float64
	ctx := context.Background()
	err := manager.downloadFile(ctx, server.URL, tmpFile, func(percent float64, status string) {
		lastPercent = percent
	})

	if err != nil {
		t.Fatalf("downloadFile() error = %v", err)
	}

	// Verify file was created
	if _, err := os.Stat(tmpFile); os.IsNotExist(err) {
		t.Error("Downloaded file was not created")
	}

	// Verify content
	data, err := os.ReadFile(tmpFile)
	if err != nil {
		t.Fatalf("Failed to read downloaded file: %v", err)
	}
	if string(data) != string(content) {
		t.Errorf("File content = %q, want %q", string(data), string(content))
	}

	// Verify progress was reported
	if lastPercent == 0 {
		t.Error("Progress was not reported")
	}
}

func TestFFmpegManager_DownloadFile_Cancel(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping network test in short mode")
	}

	// Create a slow server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Length", "10000000")
		w.WriteHeader(http.StatusOK)
		for i := 0; i < 1000; i++ {
			w.Write(make([]byte, 1000))
			time.Sleep(10 * time.Millisecond)
		}
	}))
	defer server.Close()

	fs := newMockFileSystem()
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}, func(*core.Settings) error { return nil })

	tmpFile := filepath.Join(t.TempDir(), "test-download-cancel")

	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()

	err := manager.downloadFile(ctx, server.URL, tmpFile, func(float64, string) {})

	if err == nil {
		t.Error("Expected context cancellation error")
	}
}

func TestFFmpegManager_DownloadFile_HTTPError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()

	fs := newMockFileSystem()
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}, func(*core.Settings) error { return nil })

	tmpFile := filepath.Join(t.TempDir(), "test-download-error")

	err := manager.downloadFile(context.Background(), server.URL, tmpFile, func(float64, string) {})

	if err == nil {
		t.Error("Expected HTTP error")
	}

	if !strContains(err.Error(), "404") {
		t.Errorf("Error should mention 404, got: %v", err)
	}
}

func TestFFmpegManager_ExtractZip(t *testing.T) {
	// Create a test zip file with a mock ffmpeg binary
	tmpDir := t.TempDir()
	zipPath := filepath.Join(tmpDir, "test.zip")
	destDir := filepath.Join(tmpDir, "extracted")

	if err := os.MkdirAll(destDir, 0755); err != nil {
		t.Fatalf("Failed to create dest dir: %v", err)
	}

	// Create a minimal zip file
	createTestZip(t, zipPath)

	fs := newMockFileSystem()
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}, func(*core.Settings) error { return nil })

	err := manager.extractZip(zipPath, destDir)
	if err != nil {
		t.Fatalf("extractZip() error = %v", err)
	}

	// Verify ffmpeg was extracted
	expectedPath := filepath.Join(destDir, "ffmpeg")
	if runtime.GOOS == "windows" {
		expectedPath = filepath.Join(destDir, "ffmpeg.exe")
	}

	if _, err := os.Stat(expectedPath); os.IsNotExist(err) {
		t.Errorf("FFmpeg binary was not extracted to %s", expectedPath)
	}
}

func TestFFmpegManager_BundledPath(t *testing.T) {
	fs := newMockFileSystem()
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}, func(*core.Settings) error { return nil })

	bundledPath := manager.getBundledFFmpegPath()

	expectedDir := filepath.Join(fs.configDir, "bin")
	if !strContains(bundledPath, expectedDir) {
		t.Errorf("Bundled path should be in config dir, got %q", bundledPath)
	}

	expectedName := "ffmpeg"
	if runtime.GOOS == "windows" {
		expectedName = "ffmpeg.exe"
	}
	if !strContains(bundledPath, expectedName) {
		t.Errorf("Bundled path should contain %q, got %q", expectedName, bundledPath)
	}
}

// Helper function to create a test zip file with ffmpeg
func createTestZip(t *testing.T, path string) {
	t.Helper()

	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("Failed to create zip file: %v", err)
	}
	defer f.Close()

	w := zip.NewWriter(f)
	defer w.Close()

	ffmpegName := "ffmpeg-build/bin/ffmpeg"
	if runtime.GOOS == "windows" {
		ffmpegName = "ffmpeg-build/bin/ffmpeg.exe"
	}

	fw, err := w.Create(ffmpegName)
	if err != nil {
		t.Fatalf("Failed to create file in zip: %v", err)
	}

	// Write mock binary content
	_, err = fw.Write([]byte("#!/bin/bash\necho ffmpeg mock"))
	if err != nil {
		t.Fatalf("Failed to write to zip: %v", err)
	}
}

// Helper to check string contains - renamed to avoid conflict with contains in downloader.go
func strContains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && strContainsImpl(s, substr))
}

func strContainsImpl(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
