//go:build windows

package downloader

import "os/exec"

func setupProcessGroup(cmd *exec.Cmd) {
	cmd.Cancel = func() error {
		return cmd.Process.Kill()
	}
}
