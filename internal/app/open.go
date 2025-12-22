package app

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

// openWithDefaultApp opens a file using the OS default handler.
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

// openInFileManager reveals a file/folder in the system file manager.
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
		// #nosec G204 -- dir is derived from user-selected path, validated above
		cmd = exec.Command("xdg-open", dir)
	default:
		return fmt.Errorf("unsupported platform: %s", runtime.GOOS)
	}

	return cmd.Start()
}

func isDirectory(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		return false
	}
	return info.IsDir()
}
