package downloader

import (
	"archive/zip"
	"context"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"ybdownloader/internal/core"
)

func TestGetYtDlpDownloadURL(t *testing.T) {
	url, err := getYtDlpDownloadURL()
	if err != nil {
		t.Fatalf("getYtDlpDownloadURL() error = %v", err)
	}
	if url == "" {
		t.Error("getYtDlpDownloadURL() returned empty URL")
	}
	if !strings.HasPrefix(url, ytDlpReleasesBaseURL+"/") {
		t.Errorf("URL %q does not start with expected base %q", url, ytDlpReleasesBaseURL)
	}

	tests := []struct {
		os   string
		arch string
		want string
	}{
		{"linux", "amd64", "yt-dlp_linux"},
		{"linux", "arm64", "yt-dlp_linux_aarch64"},
		{"darwin", "amd64", "yt-dlp_macos"},
		{"darwin", "arm64", "yt-dlp_macos"},
		{"windows", "amd64", "yt-dlp.exe"},
		{"windows", "arm64", "yt-dlp_arm64.exe"},
	}

	for _, tt := range tests {
		if tt.os == runtime.GOOS && tt.arch == runtime.GOARCH {
			if !strings.Contains(url, tt.want) {
				t.Errorf("on %s/%s: got %q, want URL containing %q", tt.os, tt.arch, url, tt.want)
			}
		}
	}
}

func TestGetDenoDownloadURL(t *testing.T) {
	url, err := getDenoDownloadURL()
	if err != nil {
		t.Fatalf("getDenoDownloadURL() error = %v", err)
	}
	if url == "" {
		t.Error("getDenoDownloadURL() returned empty URL")
	}
	if !strings.Contains(url, "deno") {
		t.Errorf("got %q, want URL containing deno", url)
	}
	if !strings.Contains(url, ".zip") {
		t.Errorf("got %q, want URL containing .zip", url)
	}

	tests := []struct {
		os   string
		arch string
		want string
	}{
		{"linux", "amd64", "deno-x86_64-unknown-linux-gnu.zip"},
		{"linux", "arm64", "deno-aarch64-unknown-linux-gnu.zip"},
		{"darwin", "amd64", "deno-x86_64-apple-darwin.zip"},
		{"darwin", "arm64", "deno-aarch64-apple-darwin.zip"},
		{"windows", "amd64", "deno-x86_64-pc-windows-msvc.zip"},
	}

	for _, tt := range tests {
		if tt.os == runtime.GOOS && tt.arch == runtime.GOARCH {
			if !strings.HasSuffix(url, tt.want) {
				t.Errorf("on %s/%s: got %q, want URL ending with %q", tt.os, tt.arch, url, tt.want)
			}
		}
	}
}

func TestGetDenoDownloadURL_ContainsPlatformIdentifier(t *testing.T) {
	url, err := getDenoDownloadURL()
	if err != nil {
		t.Fatalf("getDenoDownloadURL() error = %v", err)
	}

	switch runtime.GOOS {
	case "linux":
		if !strings.Contains(url, "linux") {
			t.Errorf("on linux, URL %q should contain 'linux'", url)
		}
	case "darwin":
		if !strings.Contains(url, "apple-darwin") {
			t.Errorf("on darwin, URL %q should contain 'apple-darwin'", url)
		}
	case "windows":
		if !strings.Contains(url, "windows") {
			t.Errorf("on windows, URL %q should contain 'windows'", url)
		}
	}
}

func TestYtDlpBinaryExt(t *testing.T) {
	got := ytDlpBinaryExt()
	if runtime.GOOS == "windows" {
		if got != ".exe" {
			t.Errorf("ytDlpBinaryExt() = %q, want .exe", got)
		}
	} else {
		if got != "" {
			t.Errorf("ytDlpBinaryExt() = %q, want empty on %s", got, runtime.GOOS)
		}
	}
}

func TestBinaryExt(t *testing.T) {
	got := binaryExt()
	if runtime.GOOS == "windows" {
		if got != ".exe" {
			t.Errorf("binaryExt() = %q, want .exe", got)
		}
	} else {
		if got != "" {
			t.Errorf("binaryExt() = %q, want empty on %s", got, runtime.GOOS)
		}
	}
}

func TestNewYtDlpManager(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return &core.Settings{}, nil
	}
	mgr := NewYtDlpManager(fs, getSettings)
	if mgr == nil {
		t.Fatal("NewYtDlpManager() returned nil")
	}
}

func TestGetYtDlpPath_userConfigured(t *testing.T) {
	fs := newTestFS()
	fs.fileExists["/custom/yt-dlp"] = true
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{YtDlpPath: "/custom/yt-dlp"}, nil
	})
	path, err := mgr.GetYtDlpPath()
	if err != nil {
		t.Fatal(err)
	}
	if path != "/custom/yt-dlp" {
		t.Errorf("got %q, want /custom/yt-dlp", path)
	}
}

func TestGetYtDlpPath_bundled(t *testing.T) {
	fs := newTestFS()
	bundledPath := filepath.Join(fs.configDir, "bin", "yt-dlp")
	fs.fileExists[bundledPath] = true
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})
	path, err := mgr.GetYtDlpPath()
	if err != nil {
		t.Fatal(err)
	}
	if path != bundledPath {
		t.Errorf("got %q, want %q", path, bundledPath)
	}
}

func TestGetYtDlpPath_userConfiguredOverridesBundled(t *testing.T) {
	fs := newTestFS()
	fs.fileExists["/custom/yt-dlp"] = true
	bundledPath := filepath.Join(fs.configDir, "bin", "yt-dlp")
	fs.fileExists[bundledPath] = true
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{YtDlpPath: "/custom/yt-dlp"}, nil
	})
	path, err := mgr.GetYtDlpPath()
	if err != nil {
		t.Fatal(err)
	}
	if path != "/custom/yt-dlp" {
		t.Errorf("got %q, want /custom/yt-dlp", path)
	}
}

func TestGetYtDlpPath_notFound(t *testing.T) {
	fs := newTestFS()
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})
	_, err := mgr.GetYtDlpPath()
	if err != core.ErrYtDlpNotFound {
		t.Errorf("got err %v, want ErrYtDlpNotFound", err)
	}
}

func TestGetYtDlpPath_settingsError(t *testing.T) {
	fs := newTestFS()
	fs.fileExists["/custom/yt-dlp"] = true
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return nil, core.ErrInvalidURL
	})
	_, err := mgr.GetYtDlpPath()
	if err != core.ErrInvalidURL {
		t.Errorf("got err %v, want ErrInvalidURL", err)
	}
}

func TestGetJSRuntimePath(t *testing.T) {
	fs := newTestFS()
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})
	name, path := mgr.GetJSRuntimePath()
	validNames := map[string]bool{"node": true, "deno": true, "bun": true}
	if name != "" && !validNames[name] {
		t.Errorf("GetJSRuntimePath() name = %q, expected node/deno/bun or empty", name)
	}
	if name != "" && path == "" {
		t.Error("GetJSRuntimePath() returned name but empty path")
	}
}

func TestHasJSRuntime(t *testing.T) {
	fs := newTestFS()
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})
	got := mgr.HasJSRuntime()
	name, _ := mgr.GetJSRuntimePath()
	if got != (name != "") {
		t.Errorf("HasJSRuntime() = %v, want %v (name=%q)", got, name != "", name)
	}
}

func TestExtractBinaryFromZip(t *testing.T) {
	tmpDir := t.TempDir()
	zipPath := filepath.Join(tmpDir, "test.zip")

	zipFile, err := os.Create(zipPath)
	if err != nil {
		t.Fatalf("failed to create zip: %v", err)
	}
	w := zip.NewWriter(zipFile)
	f, err := w.Create("test-bin")
	if err != nil {
		zipFile.Close()
		t.Fatalf("failed to create zip entry: %v", err)
	}
	if _, err := f.Write([]byte("binary-content")); err != nil {
		w.Close()
		zipFile.Close()
		t.Fatalf("failed to write to zip: %v", err)
	}
	if err := w.Close(); err != nil {
		zipFile.Close()
		t.Fatalf("failed to close zip writer: %v", err)
	}
	if err := zipFile.Close(); err != nil {
		t.Fatalf("failed to close zip file: %v", err)
	}

	destPath := filepath.Join(tmpDir, "test-bin")
	if err := extractBinaryFromZip(zipPath, "test-bin", destPath); err != nil {
		t.Fatal(err)
	}

	content, err := os.ReadFile(destPath)
	if err != nil {
		t.Fatalf("failed to read extracted file: %v", err)
	}
	if string(content) != "binary-content" {
		t.Errorf("got %q, want binary-content", content)
	}
}

func TestExtractBinaryFromZip_notFound(t *testing.T) {
	tmpDir := t.TempDir()
	zipPath := filepath.Join(tmpDir, "test.zip")

	zipFile, err := os.Create(zipPath)
	if err != nil {
		t.Fatalf("failed to create zip: %v", err)
	}
	w := zip.NewWriter(zipFile)
	f, err := w.Create("other-file")
	if err != nil {
		zipFile.Close()
		t.Fatalf("failed to create zip entry: %v", err)
	}
	if _, err := f.Write([]byte("data")); err != nil {
		w.Close()
		zipFile.Close()
		t.Fatalf("failed to write to zip: %v", err)
	}
	if err := w.Close(); err != nil {
		zipFile.Close()
		t.Fatalf("failed to close zip writer: %v", err)
	}
	if err := zipFile.Close(); err != nil {
		t.Fatalf("failed to close zip file: %v", err)
	}

	err = extractBinaryFromZip(zipPath, "missing-bin", filepath.Join(tmpDir, "out"))
	if err == nil {
		t.Fatal("expected error")
	}
}

func TestEnsureYtDlp_alreadyAvailable(t *testing.T) {
	fs := newTestFS()
	bundledPath := filepath.Join(fs.configDir, "bin", "yt-dlp")
	fs.fileExists[bundledPath] = true

	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})

	err := mgr.EnsureYtDlp(context.Background(), func(float64, string) {})
	if err != nil {
		t.Errorf("EnsureYtDlp() = %v, want nil when already available", err)
	}
}

func TestYtDlpManager_GetBundledBinaryPath(t *testing.T) {
	fs := newTestFS()
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})

	path := mgr.getBundledBinaryPath()
	expectedDir := filepath.Join(fs.configDir, "bin")
	expectedName := "yt-dlp"
	if runtime.GOOS == "windows" {
		expectedName = "yt-dlp.exe"
	}
	want := filepath.Join(expectedDir, expectedName)
	if path != want {
		t.Errorf("getBundledBinaryPath() = %q, want %q", path, want)
	}
}

func TestYtDlpManager_GetBundledDir(t *testing.T) {
	fs := newTestFS()
	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})

	dir := mgr.getBundledDir()
	want := filepath.Join(fs.configDir, "bin")
	if dir != want {
		t.Errorf("getBundledDir() = %q, want %q", dir, want)
	}
}

func TestYtDlpManager_GetJSRuntimePath_BundledDeno(t *testing.T) {
	fs := newTestFS()
	bundledDeno := filepath.Join(fs.configDir, "bin", "deno"+binaryExt())
	fs.fileExists[bundledDeno] = true

	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})

	name, path := mgr.GetJSRuntimePath()
	if name != "deno" {
		t.Errorf("GetJSRuntimePath() name = %q, want 'deno'", name)
	}
	if path != bundledDeno {
		t.Errorf("GetJSRuntimePath() path = %q, want %q", path, bundledDeno)
	}
}

func TestYtDlpManager_HasJSRuntime_WithBundledDeno(t *testing.T) {
	fs := newTestFS()
	bundledDeno := filepath.Join(fs.configDir, "bin", "deno"+binaryExt())
	fs.fileExists[bundledDeno] = true

	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})

	if !mgr.HasJSRuntime() {
		t.Error("HasJSRuntime() should return true when bundled deno exists")
	}
}

func TestYtDlpManager_EnsureJSRuntime_AlreadyAvailable(t *testing.T) {
	fs := newTestFS()
	bundledDeno := filepath.Join(fs.configDir, "bin", "deno"+binaryExt())
	fs.fileExists[bundledDeno] = true

	mgr := NewYtDlpManager(fs, func() (*core.Settings, error) {
		return &core.Settings{}, nil
	})

	err := mgr.EnsureJSRuntime(context.Background())
	if err != nil {
		t.Errorf("EnsureJSRuntime() = %v, want nil when already available", err)
	}
}
