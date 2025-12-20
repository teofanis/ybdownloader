package fs

import (
	"os"
	"path/filepath"
	"runtime"
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
	if !contains(dir, "ybdownload") {
		t.Errorf("GetConfigDir() = %q, should contain 'ybdownload'", dir)
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
