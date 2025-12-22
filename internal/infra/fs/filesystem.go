// Package fs provides platform-aware filesystem operations.
package fs

import (
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"strings"
	"unicode"

	"ybdownloader/internal/core"
)

const appName = "ybdownloader"

// FileSystem implements core.FileSystem with platform-aware operations.
type FileSystem struct{}

// New creates a new FileSystem instance.
func New() *FileSystem {
	return &FileSystem{}
}

// Ensure FileSystem implements core.FileSystem.
var _ core.FileSystem = (*FileSystem)(nil)

// GetConfigDir returns the OS-appropriate config directory for the app.
func (fs *FileSystem) GetConfigDir() (string, error) {
	var configBase string

	switch runtime.GOOS {
	case "windows":
		configBase = os.Getenv("APPDATA")
		if configBase == "" {
			configBase = filepath.Join(os.Getenv("USERPROFILE"), "AppData", "Roaming")
		}
	case "darwin":
		home, err := os.UserHomeDir()
		if err != nil {
			return "", err
		}
		configBase = filepath.Join(home, "Library", "Application Support")
	default: // linux and others
		configBase = os.Getenv("XDG_CONFIG_HOME")
		if configBase == "" {
			home, err := os.UserHomeDir()
			if err != nil {
				return "", err
			}
			configBase = filepath.Join(home, ".config")
		}
	}

	return filepath.Join(configBase, appName), nil
}

// GetMusicDir returns the user's Music directory.
func (fs *FileSystem) GetMusicDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	switch runtime.GOOS {
	case "windows":
		// Try USERPROFILE\Music first
		musicDir := filepath.Join(home, "Music")
		if _, err := os.Stat(musicDir); err == nil {
			return musicDir, nil
		}
		// Fallback to Downloads
		return filepath.Join(home, "Downloads"), nil
	case "darwin":
		return filepath.Join(home, "Music"), nil
	default:
		// XDG user directories on Linux
		musicDir := filepath.Join(home, "Music")
		if _, err := os.Stat(musicDir); err == nil {
			return musicDir, nil
		}
		// Fallback to Downloads
		return fs.GetDownloadsDir()
	}
}

// GetDownloadsDir returns the user's Downloads directory.
func (fs *FileSystem) GetDownloadsDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, "Downloads"), nil
}

// EnsureDir creates a directory if it doesn't exist.
func (fs *FileSystem) EnsureDir(path string) error {
	return os.MkdirAll(path, 0755) //nolint:gosec // G301: user directories need 0755
}

// FileExists checks if a file exists.
func (fs *FileSystem) FileExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return !info.IsDir()
}

// DirExists checks if a directory exists.
func (fs *FileSystem) DirExists(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}

// IsWritable checks if a path is writable.
func (fs *FileSystem) IsWritable(path string) bool {
	// Try to create a temp file in the directory
	info, err := os.Stat(path)
	if err != nil {
		// If directory doesn't exist, check parent
		parent := filepath.Dir(path)
		if parent == path {
			return false
		}
		return fs.IsWritable(parent)
	}

	if !info.IsDir() {
		return false
	}

	// Try to create a temporary file
	tmpFile := filepath.Join(path, ".ybdownload_write_test")
	f, err := os.Create(tmpFile) //nolint:gosec // test file path is safe
	if err != nil {
		return false
	}
	_ = f.Close()          //nolint:errcheck // test file
	_ = os.Remove(tmpFile) //nolint:errcheck // best-effort cleanup
	return true
}

// SanitizeFilename removes invalid characters from a filename.
func (fs *FileSystem) SanitizeFilename(name string) string {
	// Remove or replace invalid characters based on OS
	var invalidChars *regexp.Regexp
	if runtime.GOOS == "windows" {
		// Windows: < > : " / \ | ? *
		invalidChars = regexp.MustCompile(`[<>:"/\\|?*\x00-\x1f]`)
	} else {
		// Unix: / and null
		invalidChars = regexp.MustCompile(`[/\x00]`)
	}

	sanitized := invalidChars.ReplaceAllString(name, "_")

	// Trim spaces and dots from ends (Windows requirement)
	sanitized = strings.TrimSpace(sanitized)
	sanitized = strings.TrimRight(sanitized, ".")

	// Collapse multiple underscores
	sanitized = regexp.MustCompile(`_+`).ReplaceAllString(sanitized, "_")

	// Remove leading/trailing underscores
	sanitized = strings.Trim(sanitized, "_")

	// Ensure we have something
	if sanitized == "" {
		sanitized = "download"
	}

	// Limit length (Windows max path component is 255)
	if len(sanitized) > 200 {
		sanitized = sanitized[:200]
	}

	// Remove non-printable characters
	sanitized = strings.Map(func(r rune) rune {
		if unicode.IsPrint(r) {
			return r
		}
		return -1
	}, sanitized)

	return sanitized
}

// GetTempDir returns a temporary directory for downloads.
func (fs *FileSystem) GetTempDir() (string, error) {
	tmpBase := os.TempDir()
	tmpDir := filepath.Join(tmpBase, appName)
	if err := fs.EnsureDir(tmpDir); err != nil {
		return "", err
	}
	return tmpDir, nil
}
