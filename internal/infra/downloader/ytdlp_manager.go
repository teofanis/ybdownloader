package downloader

import (
	"archive/zip"
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"ybdownloader/internal/core"
)

const (
	ytDlpReleasesBaseURL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download"
)

// YtDlpManager handles yt-dlp detection, download, and management.
type YtDlpManager struct {
	fs          core.FileSystem
	getSettings func() (*core.Settings, error)
}

// NewYtDlpManager creates a new yt-dlp manager.
func NewYtDlpManager(fs core.FileSystem, getSettings func() (*core.Settings, error)) *YtDlpManager {
	return &YtDlpManager{
		fs:          fs,
		getSettings: getSettings,
	}
}

// GetYtDlpPath returns the path to the yt-dlp binary.
// Priority: 1) User-configured path, 2) Bundled yt-dlp, 3) System yt-dlp
func (m *YtDlpManager) GetYtDlpPath() (string, error) {
	settings, err := m.getSettings()
	if err != nil {
		return "", err
	}

	if settings.YtDlpPath != "" && m.fs.FileExists(settings.YtDlpPath) {
		return settings.YtDlpPath, nil
	}

	bundledPath := m.getBundledBinaryPath()
	if m.fs.FileExists(bundledPath) {
		return bundledPath, nil
	}

	if path, err := exec.LookPath("yt-dlp"); err == nil {
		return path, nil
	}

	return "", core.ErrYtDlpNotFound
}

// EnsureYtDlp ensures yt-dlp is available, downloading if necessary.
func (m *YtDlpManager) EnsureYtDlp(ctx context.Context, onProgress func(percent float64, status string)) error {
	if _, err := m.GetYtDlpPath(); err == nil {
		return nil
	}
	return m.DownloadYtDlp(ctx, onProgress)
}

// DownloadYtDlp downloads the appropriate yt-dlp binary for the current platform.
func (m *YtDlpManager) DownloadYtDlp(ctx context.Context, onProgress func(percent float64, status string)) error {
	downloadURL, err := getYtDlpDownloadURL()
	if err != nil {
		return err
	}

	slog.Info("starting yt-dlp download", "url", downloadURL, "platform", runtime.GOOS+"/"+runtime.GOARCH)
	onProgress(0, "Fetching yt-dlp...")

	bundledDir := m.getBundledDir()
	if err := m.fs.EnsureDir(bundledDir); err != nil {
		return fmt.Errorf("failed to create bundled dir: %w", err)
	}

	destPath := m.getBundledBinaryPath()
	tempDir, err := m.fs.GetTempDir()
	if err != nil {
		return fmt.Errorf("failed to get temp dir: %w", err)
	}

	tempPath := filepath.Join(tempDir, "yt-dlp-download"+ytDlpBinaryExt())
	defer os.Remove(tempPath) //nolint:errcheck

	onProgress(5, "Downloading yt-dlp...")
	if err := m.downloadFile(ctx, downloadURL, tempPath, func(percent float64, status string) {
		scaledPercent := 5 + (percent/100.0)*85
		onProgress(scaledPercent, status)
	}); err != nil {
		return fmt.Errorf("failed to download yt-dlp: %w", err)
	}

	onProgress(92, "Installing yt-dlp...")
	//nolint:gosec // G302: executable needs 0755
	if err := os.Rename(tempPath, destPath); err != nil {
		in, err := os.Open(tempPath) //nolint:gosec
		if err != nil {
			return fmt.Errorf("failed to open downloaded file: %w", err)
		}
		defer in.Close() //nolint:errcheck

		//nolint:gosec // G302: executable needs 0755
		out, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
		if err != nil {
			return fmt.Errorf("failed to create binary: %w", err)
		}
		defer out.Close() //nolint:errcheck

		if _, err := io.Copy(out, in); err != nil {
			return fmt.Errorf("failed to copy binary: %w", err)
		}
	}

	if runtime.GOOS != "windows" {
		//nolint:gosec
		if err := os.Chmod(destPath, 0755); err != nil {
			slog.Warn("failed to chmod yt-dlp binary", "error", err)
		}
	}

	onProgress(100, "yt-dlp installed successfully")
	slog.Info("yt-dlp installed", "path", destPath)
	return nil
}

// GetVersion returns the yt-dlp version string.
func (m *YtDlpManager) GetVersion(ctx context.Context) (string, error) {
	path, err := m.GetYtDlpPath()
	if err != nil {
		return "", err
	}

	cmd := exec.CommandContext(ctx, path, "--version") //nolint:gosec
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("failed to get yt-dlp version: %w", err)
	}

	return strings.TrimSpace(string(output)), nil
}

func (m *YtDlpManager) getBundledDir() string {
	configDir, _ := m.fs.GetConfigDir()
	return filepath.Join(configDir, "bin")
}

func (m *YtDlpManager) getBundledBinaryPath() string {
	return filepath.Join(m.getBundledDir(), "yt-dlp"+ytDlpBinaryExt())
}

func ytDlpBinaryExt() string {
	return binaryExt()
}

func getYtDlpDownloadURL() (string, error) {
	var filename string

	switch runtime.GOOS {
	case "linux":
		switch runtime.GOARCH {
		case "amd64":
			filename = "yt-dlp_linux"
		case "arm64":
			filename = "yt-dlp_linux_aarch64"
		default:
			return "", fmt.Errorf("unsupported Linux architecture: %s", runtime.GOARCH)
		}
	case "darwin":
		filename = "yt-dlp_macos"
	case "windows":
		switch runtime.GOARCH {
		case "amd64":
			filename = "yt-dlp.exe"
		case "arm64":
			filename = "yt-dlp_arm64.exe"
		default:
			filename = "yt-dlp.exe"
		}
	default:
		return "", fmt.Errorf("unsupported OS: %s", runtime.GOOS)
	}

	return ytDlpReleasesBaseURL + "/" + filename, nil
}

// GetJSRuntimePath returns the path to a JS runtime for yt-dlp's signature solver.
// Priority: 1) Bundled deno, 2) System deno, 3) System nodejs/node
func (m *YtDlpManager) GetJSRuntimePath() (name string, path string) {
	bundledDeno := filepath.Join(m.getBundledDir(), "deno"+binaryExt())
	if m.fs.FileExists(bundledDeno) {
		return "deno", bundledDeno
	}

	for _, rt := range []string{"deno", "nodejs", "node"} {
		if p, err := exec.LookPath(rt); err == nil {
			return rt, p
		}
	}
	return "", ""
}

// HasJSRuntime returns true if any JS runtime is available.
func (m *YtDlpManager) HasJSRuntime() bool {
	name, _ := m.GetJSRuntimePath()
	return name != ""
}

// EnsureJSRuntime ensures a JS runtime is available, downloading deno if necessary.
func (m *YtDlpManager) EnsureJSRuntime(ctx context.Context) error {
	if m.HasJSRuntime() {
		return nil
	}

	slog.Info("no JS runtime found, downloading deno for yt-dlp signature solving")
	return m.downloadDeno(ctx)
}

func (m *YtDlpManager) downloadDeno(ctx context.Context) error {
	downloadURL, err := getDenoDownloadURL()
	if err != nil {
		return err
	}

	slog.Info("downloading deno", "url", downloadURL)

	bundledDir := m.getBundledDir()
	if err := m.fs.EnsureDir(bundledDir); err != nil {
		return fmt.Errorf("failed to create bundled dir: %w", err)
	}

	tempDir, err := m.fs.GetTempDir()
	if err != nil {
		return fmt.Errorf("failed to get temp dir: %w", err)
	}

	zipPath := filepath.Join(tempDir, "deno-download.zip")
	defer os.Remove(zipPath) //nolint:errcheck

	if err := m.downloadFile(ctx, downloadURL, zipPath, func(float64, string) {}); err != nil {
		return fmt.Errorf("failed to download deno: %w", err)
	}

	destPath := filepath.Join(bundledDir, "deno"+binaryExt())
	if err := extractBinaryFromZip(zipPath, "deno"+binaryExt(), destPath); err != nil {
		return fmt.Errorf("failed to extract deno: %w", err)
	}

	if runtime.GOOS != "windows" {
		_ = os.Chmod(destPath, 0755) //nolint:errcheck,gosec
	}

	slog.Info("deno installed", "path", destPath)
	return nil
}

func getDenoDownloadURL() (string, error) {
	const base = "https://github.com/denoland/deno/releases/latest/download"
	var filename string

	switch runtime.GOOS {
	case "linux":
		switch runtime.GOARCH {
		case "amd64":
			filename = "deno-x86_64-unknown-linux-gnu.zip"
		case "arm64":
			filename = "deno-aarch64-unknown-linux-gnu.zip"
		default:
			return "", fmt.Errorf("unsupported Linux architecture for deno: %s", runtime.GOARCH)
		}
	case "darwin":
		switch runtime.GOARCH {
		case "amd64":
			filename = "deno-x86_64-apple-darwin.zip"
		case "arm64":
			filename = "deno-aarch64-apple-darwin.zip"
		default:
			filename = "deno-aarch64-apple-darwin.zip"
		}
	case "windows":
		filename = "deno-x86_64-pc-windows-msvc.zip"
	default:
		return "", fmt.Errorf("unsupported OS for deno: %s", runtime.GOOS)
	}

	return base + "/" + filename, nil
}

func extractBinaryFromZip(zipPath, binaryName, destPath string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close() //nolint:errcheck

	for _, f := range r.File {
		if filepath.Base(f.Name) != binaryName {
			continue
		}

		src, err := f.Open()
		if err != nil {
			return err
		}
		defer src.Close() //nolint:errcheck

		//nolint:gosec // G302: executable needs 0755
		dst, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
		if err != nil {
			return err
		}
		defer dst.Close() //nolint:errcheck

		//nolint:gosec // G110: deno binary is trusted from official GitHub releases
		if _, err := io.Copy(dst, src); err != nil {
			return err
		}
		return nil
	}

	return fmt.Errorf("binary %q not found in zip", binaryName)
}

func binaryExt() string {
	if runtime.GOOS == "windows" {
		return ".exe"
	}
	return ""
}

func (m *YtDlpManager) downloadFile(ctx context.Context, url, dest string, onProgress func(float64, string)) error {
	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 10 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close() //nolint:errcheck

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode, resp.Status)
	}

	//nolint:gosec // G302: executable needs 0755
	out, err := os.OpenFile(dest, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	defer out.Close() //nolint:errcheck

	totalSize := resp.ContentLength
	var downloaded int64

	buf := make([]byte, 32*1024)
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		n, readErr := resp.Body.Read(buf)
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
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			return readErr
		}
	}

	return nil
}
