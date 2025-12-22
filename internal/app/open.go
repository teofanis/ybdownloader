package app

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// openWithDefaultApp opens a file with the system's default application.
func openWithDefaultApp(path string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", path)
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", path)
	case "linux":
		cmd = exec.Command("xdg-open", path)
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	return cmd.Start()
}

// openInFileManager opens a folder in the system's file manager.
// If the path is a file, it opens the containing folder and selects the file (where supported).
func openInFileManager(path string) error {
	var cmd *exec.Cmd

	switch runtime.GOOS {
	case "darwin":
		// -R reveals the file in Finder (selects it)
		cmd = exec.Command("open", "-R", path)
	case "windows":
		// /select highlights the file in Explorer
		cmd = exec.Command("explorer", "/select,", path)
	case "linux":
		// xdg-open works on the parent directory
		// First check if it's a file, if so open parent directory
		dir := path
		if !isDirectory(path) {
			dir = filepath.Dir(path)
		}
		cmd = exec.Command("xdg-open", dir)
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	return cmd.Start()
}

// isDirectory checks if a path is a directory.
func isDirectory(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}
