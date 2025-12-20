package downloader

import (
	"context"
	"os"
	"os/exec"
	"path/filepath"
	"testing"
	"time"

	"ybdownload/internal/core"
)

func TestIsFFmpegInstalled(t *testing.T) {
	// This test just verifies the function runs without panic
	// Result depends on system configuration
	_ = IsFFmpegInstalled()
}

func TestNewFFmpeg_WithValidPath(t *testing.T) {
	// Find ffmpeg on the system
	path, err := exec.LookPath("ffmpeg")
	if err != nil {
		t.Skip("ffmpeg not installed, skipping test")
	}

	ffmpeg, err := NewFFmpeg(path)
	if err != nil {
		t.Fatalf("NewFFmpeg() error = %v", err)
	}

	if ffmpeg.Path() != path {
		t.Errorf("Path() = %v, want %v", ffmpeg.Path(), path)
	}
}

func TestNewFFmpeg_WithAutoDetect(t *testing.T) {
	if !IsFFmpegInstalled() {
		t.Skip("ffmpeg not installed, skipping test")
	}

	ffmpeg, err := NewFFmpeg("")
	if err != nil {
		t.Fatalf("NewFFmpeg() error = %v", err)
	}

	if ffmpeg.Path() == "" {
		t.Error("Path() returned empty string")
	}
}

func TestNewFFmpeg_WithInvalidPath(t *testing.T) {
	_, err := NewFFmpeg("/nonexistent/path/to/ffmpeg")
	if err == nil {
		t.Error("Expected error for invalid path")
	}
}

func TestQualityToFFmpegBitrate(t *testing.T) {
	tests := []struct {
		quality core.AudioQuality
		want    string
	}{
		{core.AudioQuality128, "128k"},
		{core.AudioQuality192, "192k"},
		{core.AudioQuality256, "256k"},
		{core.AudioQuality320, "320k"},
		{"unknown", "192k"}, // Default
	}

	for _, tt := range tests {
		t.Run(string(tt.quality), func(t *testing.T) {
			got := qualityToFFmpegBitrate(tt.quality)
			if got != tt.want {
				t.Errorf("qualityToFFmpegBitrate(%s) = %v, want %v", tt.quality, got, tt.want)
			}
		})
	}
}

func TestBuildConvertArgs_MP3(t *testing.T) {
	args := buildConvertArgs("/input.webm", "/output.mp3", core.FormatMP3, core.AudioQuality192)

	expected := []string{
		"-y",
		"-i", "/input.webm",
		"-vn",
		"-codec:a", "libmp3lame",
		"-b:a", "192k",
		"-q:a", "0",
		"/output.mp3",
	}

	if len(args) != len(expected) {
		t.Fatalf("Expected %d args, got %d", len(expected), len(args))
	}

	for i, arg := range args {
		if arg != expected[i] {
			t.Errorf("Arg[%d] = %s, want %s", i, arg, expected[i])
		}
	}
}

func TestBuildConvertArgs_M4A(t *testing.T) {
	args := buildConvertArgs("/input.webm", "/output.m4a", core.FormatM4A, core.AudioQuality256)

	// Check key args
	hasAAC := false
	hasBitrate := false
	for i, arg := range args {
		if arg == "-codec:a" && i+1 < len(args) && args[i+1] == "aac" {
			hasAAC = true
		}
		if arg == "-b:a" && i+1 < len(args) && args[i+1] == "256k" {
			hasBitrate = true
		}
	}

	if !hasAAC {
		t.Error("Expected AAC codec for M4A format")
	}
	if !hasBitrate {
		t.Error("Expected 256k bitrate")
	}
}

func TestBuildConvertArgs_MP4(t *testing.T) {
	args := buildConvertArgs("/input.webm", "/output.mp4", core.FormatMP4, core.AudioQuality192)

	// For MP4, we should keep video
	hasVN := false
	for _, arg := range args {
		if arg == "-vn" {
			hasVN = true
		}
	}

	if hasVN {
		t.Error("MP4 format should not strip video (-vn)")
	}
}

func TestFFmpeg_GetVersion(t *testing.T) {
	if !IsFFmpegInstalled() {
		t.Skip("ffmpeg not installed, skipping test")
	}

	ffmpeg, err := NewFFmpeg("")
	if err != nil {
		t.Fatalf("NewFFmpeg() error = %v", err)
	}

	version, err := ffmpeg.GetVersion(context.Background())
	if err != nil {
		t.Fatalf("GetVersion() error = %v", err)
	}

	if version == "" {
		t.Error("Expected non-empty version string")
	}

	// Version should contain "ffmpeg"
	if !contains(version, "ffmpeg") {
		t.Errorf("Version string should contain 'ffmpeg', got: %s", version)
	}
}

func TestFFmpeg_Convert_Integration(t *testing.T) {
	if testing.Short() {
		t.Skip("Skipping integration test in short mode")
	}

	if !IsFFmpegInstalled() {
		t.Skip("ffmpeg not installed, skipping test")
	}

	ffmpeg, err := NewFFmpeg("")
	if err != nil {
		t.Fatalf("NewFFmpeg() error = %v", err)
	}

	// Create a temporary test file (we'd need actual audio data for a real test)
	tmpDir := t.TempDir()
	inputPath := filepath.Join(tmpDir, "test_input.wav")
	outputPath := filepath.Join(tmpDir, "test_output.mp3")

	// Create a minimal WAV file header (silence)
	// This is a simplified test - real tests would use actual audio
	wavData := createMinimalWAV(1) // 1 second of silence
	if err := os.WriteFile(inputPath, wavData, 0644); err != nil {
		t.Fatalf("Failed to create test input: %v", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	err = ffmpeg.Convert(ctx, inputPath, outputPath, core.FormatMP3, core.AudioQuality128)
	if err != nil {
		t.Fatalf("Convert() error = %v", err)
	}

	// Check output file exists
	if _, err := os.Stat(outputPath); os.IsNotExist(err) {
		t.Error("Output file was not created")
	}
}

// createMinimalWAV creates a minimal valid WAV file with silence
func createMinimalWAV(seconds int) []byte {
	sampleRate := 44100
	channels := 2
	bitsPerSample := 16
	numSamples := sampleRate * seconds * channels
	dataSize := numSamples * (bitsPerSample / 8)

	// WAV file structure
	header := make([]byte, 44+dataSize)

	// RIFF header
	copy(header[0:4], "RIFF")
	putLE32(header[4:8], uint32(36+dataSize))
	copy(header[8:12], "WAVE")

	// fmt chunk
	copy(header[12:16], "fmt ")
	putLE32(header[16:20], 16) // chunk size
	putLE16(header[20:22], 1)  // audio format (PCM)
	putLE16(header[22:24], uint16(channels))
	putLE32(header[24:28], uint32(sampleRate))
	putLE32(header[28:32], uint32(sampleRate*channels*bitsPerSample/8)) // byte rate
	putLE16(header[32:34], uint16(channels*bitsPerSample/8))            // block align
	putLE16(header[34:36], uint16(bitsPerSample))

	// data chunk
	copy(header[36:40], "data")
	putLE32(header[40:44], uint32(dataSize))
	// Remaining bytes are zero (silence)

	return header
}

func putLE16(b []byte, v uint16) {
	b[0] = byte(v)
	b[1] = byte(v >> 8)
}

func putLE32(b []byte, v uint32) {
	b[0] = byte(v)
	b[1] = byte(v >> 8)
	b[2] = byte(v >> 16)
	b[3] = byte(v >> 24)
}
