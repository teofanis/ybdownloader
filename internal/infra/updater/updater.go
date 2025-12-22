// Package updater provides auto-update functionality for the application.
// It checks GitHub releases for new versions and handles downloading/installing updates.
package updater

import (
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
	"time"

	"github.com/blang/semver/v4"
)

const (
	GitHubOwner  = "teofanis"
	GitHubRepo   = "ybdownload"
	GitHubAPIURL = "https://api.github.com"
)

// UpdateStatus represents the current state of an update operation
type UpdateStatus string

const (
	StatusIdle        UpdateStatus = "idle"
	StatusChecking    UpdateStatus = "checking"
	StatusAvailable   UpdateStatus = "available"
	StatusDownloading UpdateStatus = "downloading"
	StatusReady       UpdateStatus = "ready"
	StatusError       UpdateStatus = "error"
	StatusUpToDate    UpdateStatus = "up_to_date"
)

// UpdateInfo contains information about an available update
type UpdateInfo struct {
	CurrentVersion string       `json:"currentVersion"`
	LatestVersion  string       `json:"latestVersion"`
	ReleaseNotes   string       `json:"releaseNotes"`
	ReleaseURL     string       `json:"releaseUrl"`
	DownloadURL    string       `json:"downloadUrl"`
	DownloadSize   int64        `json:"downloadSize"`
	Status         UpdateStatus `json:"status"`
	Progress       float64      `json:"progress"` // 0-100
	Error          string       `json:"error,omitempty"`
}

// GitHubRelease represents a GitHub release from the API
type GitHubRelease struct {
	TagName     string        `json:"tag_name"`
	Name        string        `json:"name"`
	Body        string        `json:"body"`
	HTMLURL     string        `json:"html_url"`
	Prerelease  bool          `json:"prerelease"`
	Draft       bool          `json:"draft"`
	PublishedAt time.Time     `json:"published_at"`
	Assets      []GitHubAsset `json:"assets"`
}

// GitHubAsset represents a release asset
type GitHubAsset struct {
	Name               string `json:"name"`
	Size               int64  `json:"size"`
	BrowserDownloadURL string `json:"browser_download_url"`
	ContentType        string `json:"content_type"`
}

// Updater handles application updates
type Updater struct {
	currentVersion string
	httpClient     *http.Client
	updateInfo     *UpdateInfo
	downloadPath   string
	onProgress     func(UpdateInfo)
}

// NewUpdater creates a new Updater instance
func NewUpdater(currentVersion string) *Updater {
	return &Updater{
		currentVersion: strings.TrimPrefix(currentVersion, "v"),
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		updateInfo: &UpdateInfo{
			CurrentVersion: currentVersion,
			Status:         StatusIdle,
		},
	}
}

// SetProgressCallback sets a callback function for progress updates
func (u *Updater) SetProgressCallback(callback func(UpdateInfo)) {
	u.onProgress = callback
}

// notifyProgress sends progress update to callback if set
func (u *Updater) notifyProgress() {
	if u.onProgress != nil && u.updateInfo != nil {
		u.onProgress(*u.updateInfo)
	}
}

// CheckForUpdate checks if a new version is available
func (u *Updater) CheckForUpdate(ctx context.Context) (*UpdateInfo, error) {
	u.updateInfo.Status = StatusChecking
	u.notifyProgress()

	release, err := u.getLatestRelease(ctx)
	if err != nil {
		u.updateInfo.Status = StatusError
		u.updateInfo.Error = err.Error()
		u.notifyProgress()
		return u.updateInfo, err
	}

	latestVersion := strings.TrimPrefix(release.TagName, "v")
	u.updateInfo.LatestVersion = latestVersion
	u.updateInfo.ReleaseNotes = release.Body
	u.updateInfo.ReleaseURL = release.HTMLURL

	// Compare versions
	current, err := semver.Parse(u.currentVersion)
	if err != nil {
		// If current version is not valid semver, assume update available
		u.updateInfo.Status = StatusAvailable
		u.findDownloadAsset(release)
		u.notifyProgress()
		return u.updateInfo, nil
	}

	latest, err := semver.Parse(latestVersion)
	if err != nil {
		u.updateInfo.Status = StatusError
		u.updateInfo.Error = fmt.Sprintf("invalid latest version: %s", latestVersion)
		u.notifyProgress()
		return u.updateInfo, fmt.Errorf("invalid latest version: %s", latestVersion)
	}

	if latest.GT(current) {
		u.updateInfo.Status = StatusAvailable
		u.findDownloadAsset(release)
	} else {
		u.updateInfo.Status = StatusUpToDate
	}

	u.notifyProgress()
	return u.updateInfo, nil
}

// getLatestRelease fetches the latest release from GitHub
func (u *Updater) getLatestRelease(ctx context.Context) (*GitHubRelease, error) {
	url := fmt.Sprintf("%s/repos/%s/%s/releases/latest", GitHubAPIURL, GitHubOwner, GitHubRepo)

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	req.Header.Set("User-Agent", "ybdownload-updater")

	resp, err := u.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("no releases found")
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub API error: %d", resp.StatusCode)
	}

	var release GitHubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, err
	}

	return &release, nil
}

// findDownloadAsset finds the appropriate download asset for the current platform
func (u *Updater) findDownloadAsset(release *GitHubRelease) {
	platform := runtime.GOOS
	arch := runtime.GOARCH

	// Map our naming convention to platform patterns
	var patterns []string
	switch platform {
	case "darwin":
		patterns = []string{
			"macos-universal.dmg",
			"darwin-universal.dmg",
			"macos.dmg",
		}
	case "windows":
		if arch == "amd64" {
			patterns = []string{
				"windows-amd64-installer.exe",
				"windows-amd64.exe",
				"windows-installer.exe",
				"windows.exe",
			}
		} else {
			patterns = []string{
				fmt.Sprintf("windows-%s.exe", arch),
				"windows.exe",
			}
		}
	case "linux":
		if arch == "amd64" {
			patterns = []string{
				"linux-amd64.tar.gz",
				"linux-amd64",
			}
		} else {
			patterns = []string{
				fmt.Sprintf("linux-%s.tar.gz", arch),
				fmt.Sprintf("linux-%s", arch),
			}
		}
	}

	for _, pattern := range patterns {
		for _, asset := range release.Assets {
			if strings.Contains(strings.ToLower(asset.Name), strings.ToLower(pattern)) {
				u.updateInfo.DownloadURL = asset.BrowserDownloadURL
				u.updateInfo.DownloadSize = asset.Size
				return
			}
		}
	}
}

// DownloadUpdate downloads the update to a temporary location
func (u *Updater) DownloadUpdate(ctx context.Context) (string, error) {
	if u.updateInfo.DownloadURL == "" {
		return "", fmt.Errorf("no download URL available")
	}

	u.updateInfo.Status = StatusDownloading
	u.updateInfo.Progress = 0
	u.notifyProgress()

	// Create temp directory for download
	tempDir, err := os.MkdirTemp("", "ybdownload-update-*")
	if err != nil {
		u.updateInfo.Status = StatusError
		u.updateInfo.Error = err.Error()
		u.notifyProgress()
		return "", err
	}

	// Determine filename from URL
	urlParts := strings.Split(u.updateInfo.DownloadURL, "/")
	filename := urlParts[len(urlParts)-1]
	downloadPath := filepath.Join(tempDir, filename)

	// Download file
	req, err := http.NewRequestWithContext(ctx, "GET", u.updateInfo.DownloadURL, nil)
	if err != nil {
		u.updateInfo.Status = StatusError
		u.updateInfo.Error = err.Error()
		u.notifyProgress()
		return "", err
	}

	resp, err := u.httpClient.Do(req)
	if err != nil {
		u.updateInfo.Status = StatusError
		u.updateInfo.Error = err.Error()
		u.notifyProgress()
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		u.updateInfo.Status = StatusError
		u.updateInfo.Error = fmt.Sprintf("download failed: %d", resp.StatusCode)
		u.notifyProgress()
		return "", fmt.Errorf("download failed: %d", resp.StatusCode)
	}

	// Create output file
	out, err := os.Create(downloadPath)
	if err != nil {
		u.updateInfo.Status = StatusError
		u.updateInfo.Error = err.Error()
		u.notifyProgress()
		return "", err
	}
	defer out.Close()

	// Download with progress tracking
	totalSize := resp.ContentLength
	if totalSize <= 0 {
		totalSize = u.updateInfo.DownloadSize
	}

	var downloaded int64
	buf := make([]byte, 32*1024) // 32KB buffer

	for {
		select {
		case <-ctx.Done():
			u.updateInfo.Status = StatusError
			u.updateInfo.Error = "download cancelled"
			u.notifyProgress()
			return "", ctx.Err()
		default:
		}

		n, err := resp.Body.Read(buf)
		if n > 0 {
			_, writeErr := out.Write(buf[:n])
			if writeErr != nil {
				u.updateInfo.Status = StatusError
				u.updateInfo.Error = writeErr.Error()
				u.notifyProgress()
				return "", writeErr
			}

			downloaded += int64(n)
			if totalSize > 0 {
				u.updateInfo.Progress = float64(downloaded) / float64(totalSize) * 100
				u.notifyProgress()
			}
		}

		if err == io.EOF {
			break
		}
		if err != nil {
			u.updateInfo.Status = StatusError
			u.updateInfo.Error = err.Error()
			u.notifyProgress()
			return "", err
		}
	}

	u.downloadPath = downloadPath
	u.updateInfo.Status = StatusReady
	u.updateInfo.Progress = 100
	u.notifyProgress()

	return downloadPath, nil
}

// InstallUpdate installs the downloaded update
// This will spawn an external process and exit the application
func (u *Updater) InstallUpdate() error {
	if u.downloadPath == "" {
		return fmt.Errorf("no update downloaded")
	}

	switch runtime.GOOS {
	case "darwin":
		return u.installMacOS()
	case "windows":
		return u.installWindows()
	case "linux":
		return u.installLinux()
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}
}

// installMacOS handles macOS installation (opens DMG)
func (u *Updater) installMacOS() error {
	// For macOS, we just open the DMG and let the user drag-and-drop
	// A more sophisticated approach would mount, copy, unmount
	cmd := exec.Command("open", u.downloadPath)
	return cmd.Start()
}

// installWindows handles Windows installation
func (u *Updater) installWindows() error {
	// If it's an installer, just run it
	if strings.Contains(u.downloadPath, "installer") {
		cmd := exec.Command(u.downloadPath)
		return cmd.Start()
	}

	// For portable exe, create a batch script to replace the binary
	currentExe, err := os.Executable()
	if err != nil {
		return err
	}

	// Create update script
	scriptPath := filepath.Join(filepath.Dir(u.downloadPath), "update.bat")
	script := fmt.Sprintf(`@echo off
timeout /t 2 /nobreak > nul
copy /y "%s" "%s"
start "" "%s"
del "%s"
del "%%~f0"
`, u.downloadPath, currentExe, currentExe, u.downloadPath)

	if err := os.WriteFile(scriptPath, []byte(script), 0755); err != nil {
		return err
	}

	cmd := exec.Command("cmd", "/c", "start", "/b", scriptPath)
	return cmd.Start()
}

// installLinux handles Linux installation
func (u *Updater) installLinux() error {
	currentExe, err := os.Executable()
	if err != nil {
		return err
	}

	// For tar.gz, extract first
	if strings.HasSuffix(u.downloadPath, ".tar.gz") {
		extractDir := filepath.Dir(u.downloadPath)
		cmd := exec.Command("tar", "-xzf", u.downloadPath, "-C", extractDir)
		if err := cmd.Run(); err != nil {
			return err
		}
		// Update download path to the extracted binary
		u.downloadPath = filepath.Join(extractDir, "ybdownload-linux-amd64")
	}

	// Create update script
	scriptPath := filepath.Join(filepath.Dir(u.downloadPath), "update.sh")
	script := fmt.Sprintf(`#!/bin/bash
sleep 2
cp -f "%s" "%s"
chmod +x "%s"
"%s" &
rm -f "%s"
rm -f "$0"
`, u.downloadPath, currentExe, currentExe, currentExe, u.downloadPath)

	if err := os.WriteFile(scriptPath, []byte(script), 0755); err != nil {
		return err
	}

	cmd := exec.Command("bash", scriptPath)
	return cmd.Start()
}

// GetUpdateInfo returns the current update info
func (u *Updater) GetUpdateInfo() UpdateInfo {
	if u.updateInfo == nil {
		return UpdateInfo{Status: StatusIdle}
	}
	return *u.updateInfo
}

// OpenReleasePage opens the release page in the default browser
func (u *Updater) OpenReleasePage() error {
	if u.updateInfo == nil || u.updateInfo.ReleaseURL == "" {
		return fmt.Errorf("no release URL available")
	}

	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", u.updateInfo.ReleaseURL)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", u.updateInfo.ReleaseURL)
	default:
		cmd = exec.Command("xdg-open", u.updateInfo.ReleaseURL)
	}

	return cmd.Start()
}
