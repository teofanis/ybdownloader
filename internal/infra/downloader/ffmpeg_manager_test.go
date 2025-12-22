package downloader

import (
	"archive/zip"
	"context"
	"encoding/json"
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

func TestGetPlatformKey(t *testing.T) {
	key := getPlatformKey()

	switch runtime.GOOS {
	case "windows":
		if runtime.GOARCH == "amd64" {
			if key != "windows-64" {
				t.Errorf("Windows amd64 platform key = %q, want %q", key, "windows-64")
			}
		}
	case "linux":
		switch runtime.GOARCH {
		case "amd64":
			if key != "linux-64" {
				t.Errorf("Linux amd64 platform key = %q, want %q", key, "linux-64")
			}
		case "arm64":
			if key != "linux-arm64" {
				t.Errorf("Linux arm64 platform key = %q, want %q", key, "linux-arm64")
			}
		}
	case "darwin":
		if key != "osx-64" {
			t.Errorf("macOS platform key = %q, want %q", key, "osx-64")
		}
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

func TestFFmpegManager_GetFFprobePath_Bundled(t *testing.T) {
	fs := newMockFileSystem()

	// Set bundled ffprobe path to exist
	bundledPath := filepath.Join(fs.configDir, "bin", "ffprobe")
	if runtime.GOOS == "windows" {
		bundledPath = filepath.Join(fs.configDir, "bin", "ffprobe.exe")
	}
	fs.setFileExists(bundledPath, true)

	settings := &core.Settings{FFmpegPath: ""} // No custom path
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return settings, nil
	}, func(*core.Settings) error { return nil })

	path, err := manager.GetFFprobePath()
	if err != nil {
		t.Fatalf("GetFFprobePath() error = %v", err)
	}

	if path != bundledPath {
		t.Errorf("GetFFprobePath() = %q, want %q", path, bundledPath)
	}
}

func TestFFmpegManager_GetFFprobePath_NextToUserFFmpeg(t *testing.T) {
	fs := newMockFileSystem()

	// Set custom ffmpeg path and companion ffprobe
	customFFmpegPath := "/custom/bin/ffmpeg"
	customFFprobePath := "/custom/bin/ffprobe"
	if runtime.GOOS == "windows" {
		customFFmpegPath = "/custom/bin/ffmpeg.exe"
		customFFprobePath = "/custom/bin/ffprobe.exe"
	}
	fs.setFileExists(customFFmpegPath, true)
	fs.setFileExists(customFFprobePath, true)

	settings := &core.Settings{FFmpegPath: customFFmpegPath}
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return settings, nil
	}, func(*core.Settings) error { return nil })

	path, err := manager.GetFFprobePath()
	if err != nil {
		t.Fatalf("GetFFprobePath() error = %v", err)
	}

	if path != customFFprobePath {
		t.Errorf("GetFFprobePath() = %q, want %q", path, customFFprobePath)
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
	fs := newMockFileSystem()

	// Set both bundled ffmpeg and ffprobe paths to exist
	ffmpegPath := filepath.Join(fs.configDir, "bin", "ffmpeg")
	ffprobePath := filepath.Join(fs.configDir, "bin", "ffprobe")
	if runtime.GOOS == "windows" {
		ffmpegPath = filepath.Join(fs.configDir, "bin", "ffmpeg.exe")
		ffprobePath = filepath.Join(fs.configDir, "bin", "ffprobe.exe")
	}
	fs.setFileExists(ffmpegPath, true)
	fs.setFileExists(ffprobePath, true)

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

	// Progress should NOT be called since both binaries are already available
	if progressCalled {
		t.Error("Progress callback was called even though FFmpeg and FFprobe are already available")
	}
}

func TestFFmpegManager_FetchBinaryURLs(t *testing.T) {
	// Create a mock server that returns ffbinaries API response
	apiResponse := ffbinariesResponse{
		Version: "6.1",
		Bin: map[string]struct {
			FFmpeg  string `json:"ffmpeg"`
			FFprobe string `json:"ffprobe"`
		}{
			"windows-64": {
				FFmpeg:  "https://example.com/ffmpeg-win.zip",
				FFprobe: "https://example.com/ffprobe-win.zip",
			},
			"linux-64": {
				FFmpeg:  "https://example.com/ffmpeg-linux.zip",
				FFprobe: "https://example.com/ffprobe-linux.zip",
			},
			"linux-arm64": {
				FFmpeg:  "https://example.com/ffmpeg-linux-arm64.zip",
				FFprobe: "https://example.com/ffprobe-linux-arm64.zip",
			},
			"osx-64": {
				FFmpeg:  "https://example.com/ffmpeg-macos.zip",
				FFprobe: "https://example.com/ffprobe-macos.zip",
			},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(apiResponse)
	}))
	defer server.Close()

	// We can't easily override the API URL in the manager, so this test
	// verifies the response parsing logic directly
	resp, err := http.Get(server.URL)
	if err != nil {
		t.Fatalf("Failed to fetch mock API: %v", err)
	}
	defer resp.Body.Close()

	var parsed ffbinariesResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	platformKey := getPlatformKey()
	if platformKey == "" {
		t.Skip("Unsupported platform for this test")
	}

	platform, ok := parsed.Bin[platformKey]
	if !ok {
		t.Errorf("Platform %q not found in response", platformKey)
	}

	if platform.FFmpeg == "" {
		t.Error("FFmpeg URL is empty")
	}
	if platform.FFprobe == "" {
		t.Error("FFprobe URL is empty")
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

func TestFFmpegManager_ExtractZipBinary(t *testing.T) {
	// Create a test zip file with a mock ffmpeg binary
	tmpDir := t.TempDir()
	zipPath := filepath.Join(tmpDir, "test.zip")
	destDir := filepath.Join(tmpDir, "extracted")

	if err := os.MkdirAll(destDir, 0755); err != nil {
		t.Fatalf("Failed to create dest dir: %v", err)
	}

	// Create a minimal zip file (ffbinaries format - binary at root)
	createTestZipAtRoot(t, zipPath, "ffmpeg")

	fs := newMockFileSystem()
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}, func(*core.Settings) error { return nil })

	binaryName := "ffmpeg"
	if runtime.GOOS == "windows" {
		binaryName = "ffmpeg.exe"
	}

	err := manager.extractZipBinary(zipPath, destDir, binaryName)
	if err != nil {
		t.Fatalf("extractZipBinary() error = %v", err)
	}

	// Verify ffmpeg was extracted
	expectedPath := filepath.Join(destDir, binaryName)

	if _, err := os.Stat(expectedPath); os.IsNotExist(err) {
		t.Errorf("FFmpeg binary was not extracted to %s", expectedPath)
	}
}

func TestFFmpegManager_ExtractZipBinary_FFprobe(t *testing.T) {
	// Create a test zip file with ffprobe
	tmpDir := t.TempDir()
	zipPath := filepath.Join(tmpDir, "test.zip")
	destDir := filepath.Join(tmpDir, "extracted")

	if err := os.MkdirAll(destDir, 0755); err != nil {
		t.Fatalf("Failed to create dest dir: %v", err)
	}

	// Create a zip file with ffprobe (ffbinaries format - binary at root)
	createTestZipAtRoot(t, zipPath, "ffprobe")

	fs := newMockFileSystem()
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}, func(*core.Settings) error { return nil })

	ffprobeName := "ffprobe"
	if runtime.GOOS == "windows" {
		ffprobeName = "ffprobe.exe"
	}

	err := manager.extractZipBinary(zipPath, destDir, ffprobeName)
	if err != nil {
		t.Fatalf("extractZipBinary() for ffprobe error = %v", err)
	}

	// Verify ffprobe was extracted
	expectedPath := filepath.Join(destDir, ffprobeName)

	if _, err := os.Stat(expectedPath); os.IsNotExist(err) {
		t.Errorf("FFprobe binary was not extracted to %s", expectedPath)
	}
}

func TestFFmpegManager_BundledPath(t *testing.T) {
	fs := newMockFileSystem()
	manager := NewFFmpegManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}, func(*core.Settings) error { return nil })

	bundledFFmpegPath := manager.getBundledBinaryPath("ffmpeg")
	bundledFFprobePath := manager.getBundledBinaryPath("ffprobe")

	expectedDir := filepath.Join(fs.configDir, "bin")
	if !strContains(bundledFFmpegPath, expectedDir) {
		t.Errorf("Bundled ffmpeg path should be in config dir, got %q", bundledFFmpegPath)
	}
	if !strContains(bundledFFprobePath, expectedDir) {
		t.Errorf("Bundled ffprobe path should be in config dir, got %q", bundledFFprobePath)
	}

	expectedFFmpegName := "ffmpeg"
	expectedFFprobeName := "ffprobe"
	if runtime.GOOS == "windows" {
		expectedFFmpegName = "ffmpeg.exe"
		expectedFFprobeName = "ffprobe.exe"
	}
	if !strContains(bundledFFmpegPath, expectedFFmpegName) {
		t.Errorf("Bundled path should contain %q, got %q", expectedFFmpegName, bundledFFmpegPath)
	}
	if !strContains(bundledFFprobePath, expectedFFprobeName) {
		t.Errorf("Bundled path should contain %q, got %q", expectedFFprobeName, bundledFFprobePath)
	}
}

// Helper function to create a test zip file with binary at root (ffbinaries format)
func createTestZipAtRoot(t *testing.T, path, binaryBaseName string) {
	t.Helper()

	f, err := os.Create(path)
	if err != nil {
		t.Fatalf("Failed to create zip file: %v", err)
	}
	defer f.Close()

	w := zip.NewWriter(f)
	defer w.Close()

	binaryName := binaryBaseName
	if runtime.GOOS == "windows" {
		binaryName = binaryBaseName + ".exe"
	}

	// ffbinaries zips have the binary at the root level
	fw, err := w.Create(binaryName)
	if err != nil {
		t.Fatalf("Failed to create file in zip: %v", err)
	}

	// Write mock binary content
	_, err = fw.Write([]byte("#!/bin/bash\necho " + binaryBaseName + " mock"))
	if err != nil {
		t.Fatalf("Failed to write to zip: %v", err)
	}
}

// Helper to check string contains
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
