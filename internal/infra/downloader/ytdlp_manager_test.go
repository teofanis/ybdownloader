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
	switch runtime.GOOS {
	case "linux":
		if runtime.GOARCH == "amd64" && !strings.Contains(url, "yt-dlp_linux") {
			t.Errorf("got %q, want URL containing yt-dlp_linux", url)
		}
	case "darwin":
		if !strings.Contains(url, "yt-dlp_macos") {
			t.Errorf("got %q, want URL containing yt-dlp_macos", url)
		}
	case "windows":
		if !strings.Contains(url, "yt-dlp.exe") {
			t.Errorf("got %q, want URL containing yt-dlp.exe", url)
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
