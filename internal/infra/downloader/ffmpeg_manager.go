package downloader

import (
	"archive/zip"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"ybdownloader/internal/core"
)

const (
	// ffbinariesAPIURL is the API endpoint for fetching latest FFmpeg binaries.
	// See: https://ffbinaries.com/api
	ffbinariesAPIURL = "https://ffbinaries.com/api/v1/version/latest"
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
	bundledPath := m.getBundledBinaryPath("ffmpeg")
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

// GetFFprobePath returns the path to FFprobe binary.
// Priority: 1) User-configured FFprobe path, 2) Next to user-configured FFmpeg, 3) Bundled FFprobe, 4) System FFprobe
func (m *FFmpegManager) GetFFprobePath() (string, error) {
	settings, err := m.getSettings()
	if err != nil {
		return "", err
	}

	// 1. Check user-configured FFprobe path
	if settings.FFprobePath != "" && m.fs.FileExists(settings.FFprobePath) {
		return settings.FFprobePath, nil
	}

	// 2. Check next to user-configured FFmpeg path
	if settings.FFmpegPath != "" && m.fs.FileExists(settings.FFmpegPath) {
		probePath := m.getCompanionBinaryPath(settings.FFmpegPath, "ffprobe")
		if m.fs.FileExists(probePath) {
			return probePath, nil
		}
	}

	// 3. Check bundled FFprobe
	bundledPath := m.getBundledBinaryPath("ffprobe")
	if m.fs.FileExists(bundledPath) {
		return bundledPath, nil
	}

	// 4. Check system FFprobe
	if path, err := exec.LookPath("ffprobe"); err == nil {
		return path, nil
	}

	return "", fmt.Errorf("FFprobe not found")
}

// getCompanionBinaryPath returns path to a companion binary (e.g., ffprobe next to ffmpeg)
func (m *FFmpegManager) getCompanionBinaryPath(mainBinaryPath, companionName string) string {
	dir := filepath.Dir(mainBinaryPath)
	if runtime.GOOS == "windows" {
		companionName += ".exe"
	}
	return filepath.Join(dir, companionName)
}

// EnsureFFmpeg ensures FFmpeg and FFprobe are available, downloading if necessary.
func (m *FFmpegManager) EnsureFFmpeg(ctx context.Context, onProgress func(percent float64, status string)) error {
	// Check if already available
	ffmpegPath, ffmpegErr := m.GetFFmpegPath()
	ffprobePath, ffprobeErr := m.GetFFprobePath()

	if ffmpegErr == nil && ffmpegPath != "" && ffprobeErr == nil && ffprobePath != "" {
		return nil
	}

	// Download FFmpeg and FFprobe
	return m.DownloadFFmpeg(ctx, onProgress)
}

// ffbinariesResponse represents the API response from ffbinaries.com
type ffbinariesResponse struct {
	Version string `json:"version"`
	Bin     map[string]struct {
		FFmpeg  string `json:"ffmpeg"`
		FFprobe string `json:"ffprobe"`
	} `json:"bin"`
}

// getPlatformKey returns the ffbinaries platform key for the current OS/arch.
func getPlatformKey() string {
	switch runtime.GOOS {
	case "windows":
		if runtime.GOARCH == "amd64" {
			return "windows-64"
		}
	case "linux":
		switch runtime.GOARCH {
		case "amd64":
			return "linux-64"
		case "arm64":
			return "linux-arm64"
		case "arm":
			return "linux-armhf"
		case "386":
			return "linux-32"
		}
	case "darwin":
		// ffbinaries provides osx-64 which works on both Intel and Apple Silicon (via Rosetta 2)
		return "osx-64"
	}
	return ""
}

// fetchBinaryURLs fetches the download URLs for ffmpeg and ffprobe from ffbinaries.com API.
func (m *FFmpegManager) fetchBinaryURLs(ctx context.Context) (ffmpegURL, ffprobeURL string, err error) {
	req, err := http.NewRequestWithContext(ctx, "GET", ffbinariesAPIURL, nil)
	if err != nil {
		return "", "", fmt.Errorf("failed to create request: %w", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", fmt.Errorf("failed to fetch ffbinaries API: %w", err)
	}
	defer resp.Body.Close() //nolint:errcheck // deferred close

	if resp.StatusCode != http.StatusOK {
		return "", "", fmt.Errorf("ffbinaries API returned HTTP %d", resp.StatusCode)
	}

	var apiResp ffbinariesResponse
	if err := json.NewDecoder(resp.Body).Decode(&apiResp); err != nil {
		return "", "", fmt.Errorf("failed to parse ffbinaries API response: %w", err)
	}

	platformKey := getPlatformKey()
	if platformKey == "" {
		return "", "", fmt.Errorf("unsupported platform: %s/%s", runtime.GOOS, runtime.GOARCH)
	}

	platform, ok := apiResp.Bin[platformKey]
	if !ok {
		return "", "", fmt.Errorf("no binaries available for platform: %s", platformKey)
	}

	return platform.FFmpeg, platform.FFprobe, nil
}

// DownloadFFmpeg downloads the appropriate FFmpeg and FFprobe binaries for the current platform.
func (m *FFmpegManager) DownloadFFmpeg(ctx context.Context, onProgress func(percent float64, status string)) error {
	onProgress(0, "Fetching download information...")

	ffmpegURL, ffprobeURL, err := m.fetchBinaryURLs(ctx)
	if err != nil {
		return fmt.Errorf("failed to get download URLs: %w", err)
	}

	bundledDir := m.getBundledDir()
	if err := m.fs.EnsureDir(bundledDir); err != nil {
		return fmt.Errorf("failed to create bundled dir: %w", err)
	}

	tempDir, err := m.fs.GetTempDir()
	if err != nil {
		return fmt.Errorf("failed to get temp dir: %w", err)
	}

	// Download FFmpeg (0-45%)
	onProgress(5, "Downloading FFmpeg...")
	ffmpegZip := filepath.Join(tempDir, "ffmpeg-download.zip")
	defer os.Remove(ffmpegZip) //nolint:errcheck // best-effort cleanup

	if err := m.downloadFile(ctx, ffmpegURL, ffmpegZip, func(percent float64, status string) {
		// Scale to 5-45%
		scaledPercent := 5 + (percent/100.0)*40
		onProgress(scaledPercent, status)
	}); err != nil {
		return fmt.Errorf("failed to download FFmpeg: %w", err)
	}

	// Extract FFmpeg (45-50%)
	onProgress(45, "Extracting FFmpeg...")
	ffmpegBinary := "ffmpeg"
	if runtime.GOOS == "windows" {
		ffmpegBinary = "ffmpeg.exe"
	}
	if err := m.extractZipBinary(ffmpegZip, bundledDir, ffmpegBinary); err != nil {
		return fmt.Errorf("failed to extract FFmpeg: %w", err)
	}

	// Download FFprobe (50-90%)
	onProgress(50, "Downloading FFprobe...")
	ffprobeZip := filepath.Join(tempDir, "ffprobe-download.zip")
	defer os.Remove(ffprobeZip) //nolint:errcheck // best-effort cleanup

	if err := m.downloadFile(ctx, ffprobeURL, ffprobeZip, func(percent float64, status string) {
		// Scale to 50-90%
		scaledPercent := 50 + (percent/100.0)*40
		onProgress(scaledPercent, status)
	}); err != nil {
		return fmt.Errorf("failed to download FFprobe: %w", err)
	}

	// Extract FFprobe (90-100%)
	onProgress(90, "Extracting FFprobe...")
	ffprobeBinary := "ffprobe"
	if runtime.GOOS == "windows" {
		ffprobeBinary = "ffprobe.exe"
	}
	if err := m.extractZipBinary(ffprobeZip, bundledDir, ffprobeBinary); err != nil {
		return fmt.Errorf("failed to extract FFprobe: %w", err)
	}

	onProgress(100, "FFmpeg and FFprobe installed successfully")
	return nil
}

func (m *FFmpegManager) getBundledDir() string {
	configDir, _ := m.fs.GetConfigDir()
	return filepath.Join(configDir, "bin")
}

func (m *FFmpegManager) getBundledBinaryPath(name string) string {
	binName := name
	if runtime.GOOS == "windows" {
		binName = name + ".exe"
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
	defer resp.Body.Close() //nolint:errcheck // deferred close

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	out, err := os.Create(dest) //nolint:gosec // dest is controlled path
	if err != nil {
		return err
	}
	defer out.Close() //nolint:errcheck // deferred close

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
				percent := float64(downloaded) / float64(totalSize) * 100
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

func (m *FFmpegManager) extractZipBinary(zipPath, destDir, binaryName string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close() //nolint:errcheck // deferred close

	for _, f := range r.File {
		// Look for the specific binary in the archive
		// ffbinaries zips contain the binary at the root level
		if f.Name == binaryName || strings.HasSuffix(f.Name, "/"+binaryName) {
			rc, err := f.Open()
			if err != nil {
				return err
			}
			defer rc.Close() //nolint:errcheck // deferred close

			destPath := filepath.Join(destDir, binaryName)
			//nolint:gosec // G302: executable needs 0755
			out, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
			if err != nil {
				return err
			}
			defer out.Close() //nolint:errcheck // deferred close

			_, err = io.Copy(out, rc) //nolint:gosec // G110: trusted source
			return err
		}
	}

	return fmt.Errorf("%s binary not found in archive", binaryName)
}

// findSystemFFmpeg finds FFmpeg in system PATH
func findSystemFFmpeg() (string, error) {
	return exec.LookPath("ffmpeg")
}
