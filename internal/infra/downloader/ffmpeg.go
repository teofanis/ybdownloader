package downloader

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

	"ybdownload/internal/core"
)

// FFmpeg wraps ffmpeg operations for audio/video conversion.
type FFmpeg struct {
	binaryPath string
}

// NewFFmpeg creates a new FFmpeg wrapper.
// It attempts to find ffmpeg in common locations or PATH.
func NewFFmpeg(customPath string) (*FFmpeg, error) {
	path := customPath
	if path == "" {
		var err error
		path, err = findFFmpeg()
		if err != nil {
			return nil, err
		}
	}

	// Verify ffmpeg is executable
	if _, err := exec.LookPath(path); err != nil {
		return nil, fmt.Errorf("ffmpeg not found or not executable: %s", path)
	}

	return &FFmpeg{binaryPath: path}, nil
}

// Path returns the path to the ffmpeg binary.
func (f *FFmpeg) Path() string {
	return f.binaryPath
}

// Convert converts a media file to the specified format.
func (f *FFmpeg) Convert(ctx context.Context, inputPath, outputPath string, format core.Format, audioQuality core.AudioQuality) error {
	args := buildConvertArgs(inputPath, outputPath, format, audioQuality)
	cmd := exec.CommandContext(ctx, f.binaryPath, args...) //nolint:gosec // G204: ffmpeg subprocess expected

	// Capture stderr for error messages
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ffmpeg conversion failed: %w\nOutput: %s", err, string(output))
	}

	return nil
}

// ExtractAudio extracts audio from a video file.
func (f *FFmpeg) ExtractAudio(ctx context.Context, inputPath, outputPath string, format core.Format, audioQuality core.AudioQuality) error {
	return f.Convert(ctx, inputPath, outputPath, format, audioQuality)
}

func buildConvertArgs(input, output string, format core.Format, quality core.AudioQuality) []string {
	args := []string{
		"-y",        // Overwrite output
		"-i", input, // Input file
		"-vn", // No video (audio only for audio formats)
	}

	switch format {
	case core.FormatMP3:
		bitrate := qualityToFFmpegBitrate(quality)
		args = append(args,
			"-codec:a", "libmp3lame",
			"-b:a", bitrate,
			"-q:a", "0", // Best quality
		)
	case core.FormatM4A:
		bitrate := qualityToFFmpegBitrate(quality)
		args = append(args,
			"-codec:a", "aac",
			"-b:a", bitrate,
		)
	case core.FormatMP4:
		// For MP4, we keep video
		args = []string{
			"-y",
			"-i", input,
			"-codec:v", "copy",
			"-codec:a", "aac",
			"-b:a", "192k",
		}
	}

	args = append(args, output)
	return args
}

func qualityToFFmpegBitrate(q core.AudioQuality) string {
	switch q {
	case core.AudioQuality128:
		return "128k"
	case core.AudioQuality192:
		return "192k"
	case core.AudioQuality256:
		return "256k"
	case core.AudioQuality320:
		return "320k"
	default:
		return "192k"
	}
}

func findFFmpeg() (string, error) {
	// Check PATH first
	if path, err := exec.LookPath("ffmpeg"); err == nil {
		return path, nil
	}

	// Check common locations based on OS
	var candidates []string

	switch runtime.GOOS {
	case "darwin":
		candidates = []string{
			"/usr/local/bin/ffmpeg",
			"/opt/homebrew/bin/ffmpeg",
			"/opt/local/bin/ffmpeg",
		}
	case "linux":
		candidates = []string{
			"/usr/bin/ffmpeg",
			"/usr/local/bin/ffmpeg",
			"/snap/bin/ffmpeg",
		}
	case "windows":
		// Check common Windows locations
		home := os.Getenv("USERPROFILE")
		programFiles := os.Getenv("ProgramFiles")
		programFilesX86 := os.Getenv("ProgramFiles(x86)")
		candidates = []string{
			filepath.Join(home, "ffmpeg", "bin", "ffmpeg.exe"),
			filepath.Join(programFiles, "ffmpeg", "bin", "ffmpeg.exe"),
			filepath.Join(programFilesX86, "ffmpeg", "bin", "ffmpeg.exe"),
			"C:\\ffmpeg\\bin\\ffmpeg.exe",
		}
	}

	for _, path := range candidates {
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
	}

	return "", fmt.Errorf("ffmpeg not found. Please install ffmpeg or set its path in settings")
}

// IsInstalled checks if ffmpeg is available.
func IsFFmpegInstalled() bool {
	_, err := findFFmpeg()
	return err == nil
}

// GetVersion returns the ffmpeg version string.
func (f *FFmpeg) GetVersion(ctx context.Context) (string, error) {
	cmd := exec.CommandContext(ctx, f.binaryPath, "-version") //nolint:gosec // G204: ffmpeg subprocess expected
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}

	lines := strings.Split(string(output), "\n")
	if len(lines) > 0 {
		return strings.TrimSpace(lines[0]), nil
	}
	return "", nil
}
