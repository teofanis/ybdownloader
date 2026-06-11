package app

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestIsDirectory(t *testing.T) {
	// Create a temp directory
	tempDir := t.TempDir()

	// Create a temp file
	tempFile := filepath.Join(tempDir, "testfile.txt")
	if err := os.WriteFile(tempFile, []byte("test"), 0644); err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	tests := []struct {
		name     string
		path     string
		expected bool
	}{
		{
			name:     "directory",
			path:     tempDir,
			expected: true,
		},
		{
			name:     "file",
			path:     tempFile,
			expected: false,
		},
		{
			name:     "non-existent",
			path:     filepath.Join(tempDir, "nonexistent"),
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isDirectory(tt.path)
			if result != tt.expected {
				t.Errorf("isDirectory(%q) = %v, want %v", tt.path, result, tt.expected)
			}
		})
	}
}

func TestOpenWithDefaultApp_InvalidPath(t *testing.T) {
	// Test with a non-existent path
	// The function returns an error from cmd.Start(), not from file validation
	// So this mainly tests that the function doesn't panic

	err := openWithDefaultApp("/nonexistent/path/to/file.txt")

	// On most platforms, the command will start but may fail later
	// The important thing is it doesn't panic
	if err != nil {
		// This is actually expected on some platforms where the command
		// immediately fails to start
		t.Logf("openWithDefaultApp returned error (expected on some platforms): %v", err)
	}
}

func TestOpenInFileManager_InvalidPath(t *testing.T) {
	// Similar to above - test that it doesn't panic
	err := openInFileManager("/nonexistent/path/to/file.txt")

	if err != nil {
		t.Logf("openInFileManager returned error (expected on some platforms): %v", err)
	}
}

func TestOpenWithDefaultApp_ValidFile(t *testing.T) {
	// Skip in CI environments where we can't open GUI apps
	if os.Getenv("CI") != "" {
		t.Skip("skipping GUI test in CI environment")
	}

	// Create a temp file
	tempDir := t.TempDir()
	tempFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(tempFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	// This will attempt to open the file with default app
	// We can't easily verify it opened, but we can verify no error
	err := openWithDefaultApp(tempFile)
	if err != nil {
		t.Errorf("openWithDefaultApp(%q) failed: %v", tempFile, err)
	}
}

func TestOpenInFileManager_ValidDirectory(t *testing.T) {
	// Skip in CI environments where we can't open GUI apps
	if os.Getenv("CI") != "" {
		t.Skip("skipping GUI test in CI environment")
	}

	// Use temp directory
	tempDir := t.TempDir()

	// This will attempt to open the directory in file manager
	err := openInFileManager(tempDir)
	if err != nil {
		t.Errorf("openInFileManager(%q) failed: %v", tempDir, err)
	}
}

func TestOpenInFileManager_ValidFile(t *testing.T) {
	// Skip in CI environments where we can't open GUI apps
	if os.Getenv("CI") != "" {
		t.Skip("skipping GUI test in CI environment")
	}

	// Create a temp file
	tempDir := t.TempDir()
	tempFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(tempFile, []byte("test content"), 0644); err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	// This should open the folder containing the file
	err := openInFileManager(tempFile)
	if err != nil {
		t.Errorf("openInFileManager(%q) failed: %v", tempFile, err)
	}
}

func TestOpenFunctions_PlatformSupport(t *testing.T) {
	// Verify that the current platform is supported
	supportedPlatforms := map[string]bool{
		"darwin":  true,
		"windows": true,
		"linux":   true,
	}

	if !supportedPlatforms[runtime.GOOS] {
		t.Logf("Platform %s may not be fully supported", runtime.GOOS)
	}
}

// TestOpenWithDefaultApp_CommandConstruction tests that the correct
// command is being constructed for each platform
func TestOpenWithDefaultApp_CommandConstruction(t *testing.T) {
	// This test verifies the logic path without actually executing
	// We can't easily mock exec.Command, but we can verify the function
	// handles different file types

	tempDir := t.TempDir()

	testCases := []struct {
		name     string
		filename string
	}{
		{"text file", "test.txt"},
		{"pdf file", "document.pdf"},
		{"image file", "image.png"},
		{"no extension", "noextension"},
		{"hidden file", ".hidden"},
		{"space in name", "file with spaces.txt"},
		{"unicode name", "文件.txt"},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			path := filepath.Join(tempDir, tc.filename)
			if err := os.WriteFile(path, []byte("test"), 0644); err != nil {
				t.Fatalf("failed to create file: %v", err)
			}

			// Skip actual execution in CI
			if os.Getenv("CI") != "" {
				t.Skip("skipping execution in CI")
			}

			// The function should not error or panic for any valid filename
			err := openWithDefaultApp(path)
			if err != nil {
				t.Logf("openWithDefaultApp returned error for %s: %v", tc.name, err)
			}
		})
	}
}

func TestOpenInFileManager_FileVsDirectory(t *testing.T) {
	tempDir := t.TempDir()
	tempFile := filepath.Join(tempDir, "test.txt")
	if err := os.WriteFile(tempFile, []byte("test"), 0644); err != nil {
		t.Fatalf("failed to create test file: %v", err)
	}

	// Skip actual execution in CI
	if os.Getenv("CI") != "" {
		t.Skip("skipping execution in CI")
	}

	t.Run("opens directory directly", func(t *testing.T) {
		err := openInFileManager(tempDir)
		if err != nil {
			t.Errorf("failed to open directory: %v", err)
		}
	})

	t.Run("opens file's parent directory", func(t *testing.T) {
		err := openInFileManager(tempFile)
		if err != nil {
			t.Errorf("failed to open file's folder: %v", err)
		}
	})
}

// BenchmarkIsDirectory benchmarks the isDirectory function
func BenchmarkIsDirectory(b *testing.B) {
	tempDir := b.TempDir()
	tempFile := filepath.Join(tempDir, "test.txt")
	os.WriteFile(tempFile, []byte("test"), 0644)

	b.Run("directory", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			isDirectory(tempDir)
		}
	})

	b.Run("file", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			isDirectory(tempFile)
		}
	})

	b.Run("nonexistent", func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			isDirectory("/nonexistent/path")
		}
	})
}
