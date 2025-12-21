package downloader

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"ybdownload/internal/core"
)

// FFmpegManager handles FFmpeg detection, download, and management.
type FFmpegManager struct {
	fs           core.FileSystem
	getSettings  func() (*core.Settings, error)
	saveSettings func(*core.Settings) error
}

// NewFFmpegManager creates a new FFmpeg manager.
func NewFFmpegManager(fs core.FileSystem, getSettings func() (*core.Settings, error), saveSettings func(*core.Settings) error) *FFmpegManager {
	return &FFmpegManager{
		fs:           fs,
		getSettings:  getSettings,
		saveSettings: saveSettings,
	}
}

// GetFFmpegPath returns the path to FFmpeg binary.
// Priority: 1) User-configured path, 2) Bundled FFmpeg, 3) System FFmpeg
func (m *FFmpegManager) GetFFmpegPath() (string, error) {
	settings, err := m.getSettings()
	if err != nil {
		return "", err
	}

	// 1. Check user-configured path
	if settings.FFmpegPath != "" && m.fs.FileExists(settings.FFmpegPath) {
		return settings.FFmpegPath, nil
	}

	// 2. Check bundled FFmpeg
	bundledPath := m.getBundledFFmpegPath()
	if m.fs.FileExists(bundledPath) {
		return bundledPath, nil
	}

	// 3. Check system FFmpeg
	if IsFFmpegInstalled() {
		systemPath, err := findSystemFFmpeg()
		if err == nil {
			return systemPath, nil
		}
	}

	return "", fmt.Errorf("FFmpeg not found")
}

// EnsureFFmpeg ensures FFmpeg is available, downloading if necessary.
func (m *FFmpegManager) EnsureFFmpeg(ctx context.Context, onProgress func(percent float64, status string)) error {
	// Check if already available
	path, err := m.GetFFmpegPath()
	if err == nil && path != "" {
		return nil
	}

	// Download FFmpeg
	return m.DownloadFFmpeg(ctx, onProgress)
}

// DownloadFFmpeg downloads the appropriate FFmpeg binary for the current platform.
func (m *FFmpegManager) DownloadFFmpeg(ctx context.Context, onProgress func(percent float64, status string)) error {
	url, archiveType := m.getDownloadURL()
	if url == "" {
		return fmt.Errorf("unsupported platform: %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	onProgress(0, "Downloading FFmpeg...")

	// Create temp file for download
	tempDir, err := m.fs.GetTempDir()
	if err != nil {
		return fmt.Errorf("failed to get temp dir: %w", err)
	}

	tempFile := filepath.Join(tempDir, "ffmpeg-download"+archiveType)
	defer os.Remove(tempFile)

	// Download
	if err := m.downloadFile(ctx, url, tempFile, onProgress); err != nil {
		return fmt.Errorf("download failed: %w", err)
	}

	onProgress(80, "Extracting FFmpeg...")

	// Extract
	bundledDir := m.getBundledDir()
	if err := m.fs.EnsureDir(bundledDir); err != nil {
		return fmt.Errorf("failed to create bundled dir: %w", err)
	}

	if err := m.extractFFmpeg(tempFile, bundledDir, archiveType); err != nil {
		return fmt.Errorf("extraction failed: %w", err)
	}

	onProgress(100, "FFmpeg installed successfully")
	return nil
}

func (m *FFmpegManager) getDownloadURL() (url string, archiveType string) {
	// Using FFmpeg builds from GitHub (BtbN/FFmpeg-Builds)
	// These are static builds that work without dependencies
	baseURL := "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/"

	switch runtime.GOOS {
	case "windows":
		if runtime.GOARCH == "amd64" {
			return baseURL + "ffmpeg-master-latest-win64-gpl.zip", ".zip"
		}
	case "linux":
		switch runtime.GOARCH {
		case "amd64":
			return baseURL + "ffmpeg-master-latest-linux64-gpl.tar.xz", ".tar.xz"
		case "arm64":
			return baseURL + "ffmpeg-master-latest-linuxarm64-gpl.tar.xz", ".tar.xz"
		}
	case "darwin":
		// macOS builds from evermeet.cx (universal binary works for both)
		if runtime.GOARCH == "amd64" || runtime.GOARCH == "arm64" {
			return "https://evermeet.cx/ffmpeg/getrelease/ffmpeg/zip", ".zip"
		}
	}
	return "", ""
}

func (m *FFmpegManager) getBundledDir() string {
	configDir, _ := m.fs.GetConfigDir()
	return filepath.Join(configDir, "bin")
}

func (m *FFmpegManager) getBundledFFmpegPath() string {
	binName := "ffmpeg"
	if runtime.GOOS == "windows" {
		binName = "ffmpeg.exe"
	}
	return filepath.Join(m.getBundledDir(), binName)
}

func (m *FFmpegManager) downloadFile(ctx context.Context, url, dest string, onProgress func(float64, string)) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	totalSize := resp.ContentLength
	var downloaded int64

	buf := make([]byte, 32*1024)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		n, err := resp.Body.Read(buf)
		if n > 0 {
			if _, writeErr := out.Write(buf[:n]); writeErr != nil {
				return writeErr
			}
			downloaded += int64(n)
			if totalSize > 0 {
				percent := float64(downloaded) / float64(totalSize) * 70 // 0-70% for download
				onProgress(percent, fmt.Sprintf("Downloading... %d%%", int(percent)))
			}
		}
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}
	}

	return nil
}

func (m *FFmpegManager) extractFFmpeg(archivePath, destDir, archiveType string) error {
	switch archiveType {
	case ".zip":
		return m.extractZip(archivePath, destDir)
	case ".tar.xz", ".tar.gz":
		return m.extractTar(archivePath, destDir, archiveType)
	default:
		return fmt.Errorf("unsupported archive type: %s", archiveType)
	}
}

func (m *FFmpegManager) extractZip(zipPath, destDir string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()

	ffmpegName := "ffmpeg"
	if runtime.GOOS == "windows" {
		ffmpegName = "ffmpeg.exe"
	}

	for _, f := range r.File {
		// Look for ffmpeg binary in the archive
		if strings.HasSuffix(f.Name, ffmpegName) || strings.HasSuffix(f.Name, "/"+ffmpegName) {
			rc, err := f.Open()
			if err != nil {
				return err
			}
			defer rc.Close()

			destPath := filepath.Join(destDir, ffmpegName)
			out, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
			if err != nil {
				return err
			}
			defer out.Close()

			_, err = io.Copy(out, rc)
			return err
		}
	}

	return fmt.Errorf("ffmpeg binary not found in archive")
}

func (m *FFmpegManager) extractTar(tarPath, destDir, archiveType string) error {
	file, err := os.Open(tarPath)
	if err != nil {
		return err
	}
	defer file.Close()

	var reader io.Reader = file

	// Handle compression
	if strings.HasSuffix(archiveType, ".gz") {
		gzr, err := gzip.NewReader(file)
		if err != nil {
			return err
		}
		defer gzr.Close()
		reader = gzr
	} else if strings.HasSuffix(archiveType, ".xz") {
		// For .xz, we need to use external xz command or a Go library
		// For simplicity, let's try using the system's xz if available
		return m.extractTarXZ(tarPath, destDir)
	}

	tr := tar.NewReader(reader)

	ffmpegName := "ffmpeg"
	for {
		header, err := tr.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		if strings.HasSuffix(header.Name, ffmpegName) || strings.HasSuffix(header.Name, "/"+ffmpegName) {
			destPath := filepath.Join(destDir, ffmpegName)
			out, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
			if err != nil {
				return err
			}
			defer out.Close()

			_, err = io.Copy(out, tr)
			return err
		}
	}

	return fmt.Errorf("ffmpeg binary not found in archive")
}

func (m *FFmpegManager) extractTarXZ(tarXZPath, destDir string) error {
	// Use system xz to decompress, then extract
	// This is a fallback - ideally we'd use a pure Go xz library

	// For now, let's try to extract using a different approach
	// We'll shell out to tar if available
	tempTar := tarXZPath + ".tar"
	defer os.Remove(tempTar)

	// Try using xz command
	cmd := execCommand("xz", "-dk", tarXZPath)
	if err := cmd.Run(); err != nil {
		// xz not available, try using tar directly with -J flag
		cmd = execCommand("tar", "-xJf", tarXZPath, "-C", destDir, "--wildcards", "*/ffmpeg")
		if err := cmd.Run(); err != nil {
			return fmt.Errorf("failed to extract .tar.xz: xz and tar -J both failed: %w", err)
		}
		// Find and move ffmpeg to destDir root
		return m.moveFFmpegToRoot(destDir)
	}

	// xz succeeded, now extract tar
	return m.extractTar(tempTar, destDir, ".tar")
}

func (m *FFmpegManager) moveFFmpegToRoot(dir string) error {
	// Find ffmpeg in subdirectories and move to root
	var ffmpegPath string
	_ = filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.Name() == "ffmpeg" && !info.IsDir() {
			ffmpegPath = path
			return filepath.SkipAll
		}
		return nil
	})

	if ffmpegPath == "" {
		return fmt.Errorf("ffmpeg not found after extraction")
	}

	destPath := filepath.Join(dir, "ffmpeg")
	if ffmpegPath != destPath {
		return os.Rename(ffmpegPath, destPath)
	}
	return nil
}

// execCommand is a wrapper for exec.Command to allow testing
var execCommand = func(name string, args ...string) interface{ Run() error } {
	return &realExecCommand{name: name, args: args}
}

type realExecCommand struct {
	name string
	args []string
}

func (c *realExecCommand) Run() error {
	cmd := exec.Command(c.name, c.args...)
	return cmd.Run()
}

// findSystemFFmpeg finds FFmpeg in system PATH
func findSystemFFmpeg() (string, error) {
	return exec.LookPath("ffmpeg")
}
