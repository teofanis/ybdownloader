package fs

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestSanitizeFilename(t *testing.T) {
	fs := New()

	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "simple valid filename",
			input:    "my video",
			expected: "my video",
		},
		{
			name:     "removes slashes",
			input:    "my/video/file",
			expected: "my_video_file",
		},
		{
			name:     "removes null bytes",
			input:    "my\x00video",
			expected: "my_video",
		},
		{
			name:     "handles empty input",
			input:    "",
			expected: "download",
		},
		{
			name:     "collapses multiple underscores",
			input:    "my___video",
			expected: "my_video",
		},
		{
			name:     "trims leading/trailing underscores",
			input:    "__my video__",
			expected: "my video",
		},
		{
			name:     "handles unicode",
			input:    "日本語ファイル名",
			expected: "日本語ファイル名",
		},
		{
			name:     "truncates long filenames",
			input:    string(make([]byte, 250)),
			expected: "download", // all zeros become underscores, then "download"
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := fs.SanitizeFilename(tt.input)
			// For truncation test, just check length
			if tt.name == "truncates long filenames" {
				if len(result) > 200 {
					t.Errorf("expected length <= 200, got %d", len(result))
				}
			} else if result != tt.expected {
				t.Errorf("SanitizeFilename(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestSanitizeFilenameWindows(t *testing.T) {
	if runtime.GOOS != "windows" {
		t.Skip("Skipping Windows-specific test")
	}

	fs := New()

	tests := []struct {
		input    string
		expected string
	}{
		{"my<video>", "my_video_"},
		{"file:name", "file_name"},
		{`path\to\file`, "path_to_file"},
		{"file?name*", "file_name_"},
	}

	for _, tt := range tests {
		result := fs.SanitizeFilename(tt.input)
		if result != tt.expected {
			t.Errorf("SanitizeFilename(%q) = %q, want %q", tt.input, result, tt.expected)
		}
	}
}

func TestGetConfigDir(t *testing.T) {
	fs := New()

	dir, err := fs.GetConfigDir()
	if err != nil {
		t.Fatalf("GetConfigDir() error = %v", err)
	}

	if dir == "" {
		t.Error("GetConfigDir() returned empty string")
	}

	// Check it contains the app name
	if !contains(dir, "ybdownloader") {
		t.Errorf("GetConfigDir() = %q, should contain 'ybdownloader'", dir)
	}
}

func TestGetMusicDir(t *testing.T) {
	fs := New()

	dir, err := fs.GetMusicDir()
	if err != nil {
		t.Fatalf("GetMusicDir() error = %v", err)
	}

	if dir == "" {
		t.Error("GetMusicDir() returned empty string")
	}
}

func TestEnsureDir(t *testing.T) {
	fs := New()

	tmpDir := t.TempDir()
	testDir := filepath.Join(tmpDir, "test", "nested", "dir")

	err := fs.EnsureDir(testDir)
	if err != nil {
		t.Fatalf("EnsureDir() error = %v", err)
	}

	info, err := os.Stat(testDir)
	if err != nil {
		t.Fatalf("Directory not created: %v", err)
	}

	if !info.IsDir() {
		t.Error("EnsureDir() did not create a directory")
	}
}

func TestIsWritable(t *testing.T) {
	fs := New()

	tmpDir := t.TempDir()

	if !fs.IsWritable(tmpDir) {
		t.Error("IsWritable() returned false for writable temp directory")
	}

	// Test non-existent path (should check parent)
	nonExistent := filepath.Join(tmpDir, "nonexistent")
	if !fs.IsWritable(nonExistent) {
		t.Error("IsWritable() returned false for non-existent path with writable parent")
	}
}

func TestGetTempDir(t *testing.T) {
	fs := New()

	dir, err := fs.GetTempDir()
	if err != nil {
		t.Fatalf("GetTempDir() error = %v", err)
	}

	if dir == "" {
		t.Error("GetTempDir() returned empty string")
	}

	// Should be writable
	if !fs.IsWritable(dir) {
		t.Errorf("GetTempDir() returned non-writable directory: %s", dir)
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsSubstr(s, substr))
}

func containsSubstr(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func TestFileExists(t *testing.T) {
	fs := New()

	tmpDir := t.TempDir()

	// Create a test file
	testFile := filepath.Join(tmpDir, "testfile.txt")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	if !fs.FileExists(testFile) {
		t.Error("FileExists() returned false for existing file")
	}

	// Test non-existent file
	if fs.FileExists(filepath.Join(tmpDir, "nonexistent.txt")) {
		t.Error("FileExists() returned true for non-existent file")
	}

	// Test directory (should return false)
	if fs.FileExists(tmpDir) {
		t.Error("FileExists() returned true for directory")
	}
}

func TestDirExists(t *testing.T) {
	fs := New()

	tmpDir := t.TempDir()

	if !fs.DirExists(tmpDir) {
		t.Error("DirExists() returned false for existing directory")
	}

	// Test non-existent directory
	if fs.DirExists(filepath.Join(tmpDir, "nonexistent")) {
		t.Error("DirExists() returned true for non-existent directory")
	}

	// Create a file and check it returns false
	testFile := filepath.Join(tmpDir, "testfile.txt")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}
	if fs.DirExists(testFile) {
		t.Error("DirExists() returned true for file")
	}
}

func TestGetDownloadsDir(t *testing.T) {
	fs := New()

	dir, err := fs.GetDownloadsDir()
	if err != nil {
		t.Fatalf("GetDownloadsDir() error = %v", err)
	}

	if dir == "" {
		t.Error("GetDownloadsDir() returned empty string")
	}

	// Should contain "Downloads"
	if !contains(dir, "Downloads") {
		t.Errorf("GetDownloadsDir() = %q, should contain 'Downloads'", dir)
	}
}

func TestNew(t *testing.T) {
	fs := New()
	if fs == nil {
		t.Fatal("New() returned nil")
	}
}

func TestIsWritable_File(t *testing.T) {
	fs := New()

	tmpDir := t.TempDir()

	// Create a file
	testFile := filepath.Join(tmpDir, "testfile.txt")
	if err := os.WriteFile(testFile, []byte("test"), 0644); err != nil {
		t.Fatalf("Failed to create test file: %v", err)
	}

	// File is not a directory, should return false
	if fs.IsWritable(testFile) {
		t.Error("IsWritable() returned true for a file (not directory)")
	}
}

func TestSanitizeFilename_TrailingDots(t *testing.T) {
	fs := New()

	input := "filename..."
	result := fs.SanitizeFilename(input)
	if result != "filename" {
		t.Errorf("SanitizeFilename(%q) = %q, want %q", input, result, "filename")
	}
}

func TestSanitizeFilename_OnlyInvalidChars(t *testing.T) {
	fs := New()

	input := "///"
	result := fs.SanitizeFilename(input)
	if result != "download" {
		t.Errorf("SanitizeFilename(%q) = %q, want %q", input, result, "download")
	}
}

func TestGetConfigDir_WithXDGConfigHome(t *testing.T) {
	if runtime.GOOS == "windows" || runtime.GOOS == "darwin" {
		t.Skip("XDG_CONFIG_HOME only applies on Linux")
	}

	customConfig := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", customConfig)

	fs := New()
	dir, err := fs.GetConfigDir()
	if err != nil {
		t.Fatalf("GetConfigDir() error = %v", err)
	}

	expected := filepath.Join(customConfig, "ybdownloader")
	if dir != expected {
		t.Errorf("GetConfigDir() = %q, want %q", dir, expected)
	}
}

func TestGetConfigDir_WithoutXDGConfigHome(t *testing.T) {
	if runtime.GOOS == "windows" || runtime.GOOS == "darwin" {
		t.Skip("XDG_CONFIG_HOME only applies on Linux")
	}

	t.Setenv("XDG_CONFIG_HOME", "")

	fs := New()
	dir, err := fs.GetConfigDir()
	if err != nil {
		t.Fatalf("GetConfigDir() error = %v", err)
	}

	home, _ := os.UserHomeDir()
	expected := filepath.Join(home, ".config", "ybdownloader")
	if dir != expected {
		t.Errorf("GetConfigDir() = %q, want %q", dir, expected)
	}
}

func TestGetMusicDir_MusicExists(t *testing.T) {
	if runtime.GOOS == "windows" || runtime.GOOS == "darwin" {
		t.Skip("Linux-specific test")
	}

	tmpDir := t.TempDir()
	musicDir := filepath.Join(tmpDir, "Music")
	if err := os.MkdirAll(musicDir, 0755); err != nil {
		t.Fatalf("failed to create Music dir: %v", err)
	}
	t.Setenv("HOME", tmpDir)

	fs := New()
	dir, err := fs.GetMusicDir()
	if err != nil {
		t.Fatalf("GetMusicDir() error = %v", err)
	}

	if dir != musicDir {
		t.Errorf("GetMusicDir() = %q, want %q", dir, musicDir)
	}
}

func TestGetMusicDir_FallbackToDownloads(t *testing.T) {
	if runtime.GOOS == "windows" || runtime.GOOS == "darwin" {
		t.Skip("Linux-specific test")
	}

	tmpDir := t.TempDir()
	t.Setenv("HOME", tmpDir)

	fs := New()
	dir, err := fs.GetMusicDir()
	if err != nil {
		t.Fatalf("GetMusicDir() error = %v", err)
	}

	expected := filepath.Join(tmpDir, "Downloads")
	if dir != expected {
		t.Errorf("GetMusicDir() = %q, want %q", dir, expected)
	}
}

func TestIsWritable_ReadOnlyDir(t *testing.T) {
	if os.Getuid() == 0 {
		t.Skip("test requires non-root user")
	}

	tmpDir := t.TempDir()
	readOnlyDir := filepath.Join(tmpDir, "readonly")
	if err := os.MkdirAll(readOnlyDir, 0755); err != nil {
		t.Fatalf("failed to create dir: %v", err)
	}
	if err := os.Chmod(readOnlyDir, 0555); err != nil {
		t.Fatalf("failed to chmod dir: %v", err)
	}
	t.Cleanup(func() { _ = os.Chmod(readOnlyDir, 0755) })

	fs := New()
	if fs.IsWritable(readOnlyDir) {
		t.Error("IsWritable() returned true for read-only directory")
	}
}

func TestSanitizeFilename_TruncatesLongValid(t *testing.T) {
	fs := New()

	longName := strings.Repeat("a", 250)
	result := fs.SanitizeFilename(longName)
	if len(result) != 200 {
		t.Errorf("SanitizeFilename() length = %d, want 200", len(result))
	}
}

func TestSanitizeFilename_NonPrintable(t *testing.T) {
	fs := New()

	result := fs.SanitizeFilename("hello\x01world")
	if result != "helloworld" {
		t.Errorf("SanitizeFilename() = %q, want %q", result, "helloworld")
	}
}
