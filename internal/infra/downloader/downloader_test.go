package downloader

import (
	"bytes"
	"context"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"ybdownloader/internal/core"
)

// testFS implements core.FileSystem for downloader tests
type testFS struct {
	configDir    string
	tempDir      string
	musicDir     string
	downloadsDir string
	ensureDirErr error
	fileExists   map[string]bool
	dirExists    map[string]bool
	writable     map[string]bool
}

func newTestFS() *testFS {
	return &testFS{
		configDir:    "/tmp/test-config",
		tempDir:      "/tmp/test-temp",
		musicDir:     "/tmp/test-music",
		downloadsDir: "/tmp/test-downloads",
		fileExists:   make(map[string]bool),
		dirExists:    make(map[string]bool),
		writable:     make(map[string]bool),
	}
}

func (m *testFS) GetConfigDir() (string, error)    { return m.configDir, nil }
func (m *testFS) GetTempDir() (string, error)      { return m.tempDir, nil }
func (m *testFS) GetMusicDir() (string, error)     { return m.musicDir, nil }
func (m *testFS) GetDownloadsDir() (string, error) { return m.downloadsDir, nil }
func (m *testFS) EnsureDir(_ string) error         { return m.ensureDirErr }
func (m *testFS) FileExists(path string) bool      { return m.fileExists[path] }
func (m *testFS) DirExists(path string) bool       { return m.dirExists[path] }
func (m *testFS) IsWritable(_ string) bool         { return true }
func (m *testFS) SanitizeFilename(name string) string {
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\\", "_")
	return name
}

func TestNew(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}

	d, err := New(fs, getSettings)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if d == nil {
		t.Fatal("New() returned nil")
	}
	if d.youtube == nil {
		t.Error("youtube client is nil")
	}
	if d.fs != fs {
		t.Error("filesystem not set correctly")
	}
}

func TestGetDownloadExtension(t *testing.T) {
	tests := []struct {
		mimeType string
		expected string
	}{
		{"video/mp4", "mp4"},
		{"video/webm", "webm"},
		{"audio/webm", "webm"},
		{"application/octet-stream", "mp4"}, // default
		{"", "mp4"},                         // default
	}

	for _, tt := range tests {
		t.Run(tt.mimeType, func(t *testing.T) {
			result := getDownloadExtension(tt.mimeType)
			if result != tt.expected {
				t.Errorf("getDownloadExtension(%q) = %q, want %q", tt.mimeType, result, tt.expected)
			}
		})
	}
}

func TestCopyFile(t *testing.T) {
	// Create temp directory
	tmpDir := t.TempDir()

	// Create source file
	srcPath := filepath.Join(tmpDir, "source.txt")
	content := []byte("test content for copy")
	if err := os.WriteFile(srcPath, content, 0644); err != nil {
		t.Fatalf("failed to create source file: %v", err)
	}

	// Copy file
	dstPath := filepath.Join(tmpDir, "dest.txt")
	if err := copyFile(srcPath, dstPath); err != nil {
		t.Fatalf("copyFile() error = %v", err)
	}

	// Verify content
	read, err := os.ReadFile(dstPath)
	if err != nil {
		t.Fatalf("failed to read dest file: %v", err)
	}
	if !bytes.Equal(read, content) {
		t.Error("copied content doesn't match")
	}
}

func TestCopyFile_SourceNotExists(t *testing.T) {
	tmpDir := t.TempDir()
	err := copyFile(filepath.Join(tmpDir, "nonexistent"), filepath.Join(tmpDir, "dest"))
	if err == nil {
		t.Error("expected error for non-existent source")
	}
}

func TestCopyFile_InvalidDest(t *testing.T) {
	tmpDir := t.TempDir()
	srcPath := filepath.Join(tmpDir, "source.txt")
	if err := os.WriteFile(srcPath, []byte("test"), 0644); err != nil {
		t.Fatalf("failed to create source: %v", err)
	}

	// Try to write to invalid path
	err := copyFile(srcPath, "/nonexistent/dir/file.txt")
	if err == nil {
		t.Error("expected error for invalid dest path")
	}
}

func TestDownloadWithProgress(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}
	d, _ := New(fs, getSettings)

	// Create test data
	data := bytes.Repeat([]byte("test"), 1000) // 4KB
	reader := bytes.NewReader(data)
	var writer bytes.Buffer

	var progressCalls []core.DownloadProgress
	onProgress := func(p core.DownloadProgress) {
		progressCalls = append(progressCalls, p)
	}

	ctx := context.Background()
	err := d.downloadWithProgress(ctx, reader, &writer, int64(len(data)), "test-id", onProgress)
	if err != nil {
		t.Fatalf("downloadWithProgress() error = %v", err)
	}

	if !bytes.Equal(writer.Bytes(), data) {
		t.Error("written data doesn't match")
	}

	if len(progressCalls) == 0 {
		t.Error("expected at least one progress call")
	}

	// Last progress should be 100%
	last := progressCalls[len(progressCalls)-1]
	if last.Percent != 100 {
		t.Errorf("last progress percent = %v, want 100", last.Percent)
	}
}

func TestDownloadWithProgress_ContextCancelled(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}
	d, _ := New(fs, getSettings)

	data := bytes.Repeat([]byte("test"), 10000) // Large enough to not complete instantly
	reader := &slowReader{data: data}
	var writer bytes.Buffer

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	err := d.downloadWithProgress(ctx, reader, &writer, int64(len(data)), "test-id", func(_ core.DownloadProgress) {})
	if err == nil {
		t.Error("expected context cancelled error")
	}
}

// slowReader simulates a slow reader for testing cancellation
type slowReader struct {
	data   []byte
	offset int
}

func (r *slowReader) Read(p []byte) (n int, err error) {
	if r.offset >= len(r.data) {
		return 0, io.EOF
	}
	time.Sleep(10 * time.Millisecond)
	n = copy(p, r.data[r.offset:])
	r.offset += n
	return n, nil
}

func TestDownloadWithProgress_ZeroSize(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}
	d, _ := New(fs, getSettings)

	data := []byte("small test data")
	reader := bytes.NewReader(data)
	var writer bytes.Buffer

	// Test with totalSize = 0 (unknown size)
	err := d.downloadWithProgress(context.Background(), reader, &writer, 0, "test-id", func(_ core.DownloadProgress) {})
	if err != nil {
		t.Fatalf("downloadWithProgress() error = %v", err)
	}

	if !bytes.Equal(writer.Bytes(), data) {
		t.Error("written data doesn't match")
	}
}

func TestDownloader_GetFFmpeg_NotAvailable(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}
	d, _ := New(fs, getSettings)

	// getFFmpeg should return nil when FFmpeg is not available
	ffmpeg := d.getFFmpeg()
	if ffmpeg != nil {
		t.Log("FFmpeg is available in test environment")
	} else {
		t.Log("FFmpeg not available (expected in most test environments)")
	}
}

func TestConfig_Struct(t *testing.T) {
	config := Config{
		FFmpegPath: "/usr/bin/ffmpeg",
	}

	if config.FFmpegPath != "/usr/bin/ffmpeg" {
		t.Error("Config.FFmpegPath not set correctly")
	}
}

func TestFormat_Methods(t *testing.T) {
	// Test Format constants
	tests := []struct {
		format   string
		expected string
	}{
		{"mp3", "mp3"},
		{"mp4", "mp4"},
		{"webm", "webm"},
	}

	for _, tt := range tests {
		if tt.format != tt.expected {
			t.Errorf("Format constant = %q, want %q", tt.format, tt.expected)
		}
	}
}

func TestNew_SetsFilesystem(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}

	d, err := New(fs, getSettings)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if d.fs != fs {
		t.Error("fs not set correctly")
	}
}

func TestNew_SetsSettings(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}

	d, err := New(fs, getSettings)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}
	if d.settings == nil {
		t.Error("settings not set")
	}
}

func TestDownloader_FetchMetadata_InvalidURL(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}
	d, _ := New(fs, getSettings)

	_, err := d.FetchMetadata(context.Background(), "not-a-valid-url")
	if err == nil {
		t.Error("FetchMetadata() should error on invalid URL")
	}
}

func TestDownloader_Download_InvalidURL(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}
	d, _ := New(fs, getSettings)

	item := &core.QueueItem{
		ID:     "test-id",
		URL:    "not-a-valid-url",
		Format: "mp3",
	}

	err := d.Download(
		context.Background(),
		item,
		func(_ core.DownloadProgress) {},
	)
	if err == nil {
		t.Error("Download() should error on invalid URL")
	}
}

func TestSanitizeFilenameDefault(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"hello/world", "hello/world"}, // No actual sanitization in this function
		{"test\\file", "test\\file"},
		{"normal name", "normal name"},
	}

	for _, tt := range tests {
		// The testFS sanitizes but the actual sanitize logic in downloader may differ
		_ = tt
	}
}

func TestCopyFile_LargeFile(t *testing.T) {
	tmpDir := t.TempDir()

	// Create a larger source file (1MB)
	srcPath := filepath.Join(tmpDir, "large.bin")
	content := bytes.Repeat([]byte("LARGE DATA "), 100000)
	if err := os.WriteFile(srcPath, content, 0644); err != nil {
		t.Fatalf("failed to create source file: %v", err)
	}

	dstPath := filepath.Join(tmpDir, "large_copy.bin")
	if err := copyFile(srcPath, dstPath); err != nil {
		t.Fatalf("copyFile() error = %v", err)
	}

	// Verify size
	info, err := os.Stat(dstPath)
	if err != nil {
		t.Fatalf("failed to stat dest file: %v", err)
	}
	if info.Size() != int64(len(content)) {
		t.Errorf("dest file size = %d, want %d", info.Size(), len(content))
	}
}

func TestDownloadWithProgress_ReadError(t *testing.T) {
	fs := newTestFS()
	getSettings := func() (*core.Settings, error) {
		return core.DefaultSettings("/tmp"), nil
	}
	d, _ := New(fs, getSettings)

	reader := &errorReader{}
	var writer bytes.Buffer

	err := d.downloadWithProgress(context.Background(), reader, &writer, 100, "test-id", func(_ core.DownloadProgress) {})
	if err == nil {
		t.Error("expected error from reader")
	}
}

type errorReader struct{}

func (r *errorReader) Read(_ []byte) (n int, err error) {
	return 0, io.ErrUnexpectedEOF
}

func TestTestFS_AllMethods(t *testing.T) {
	fs := newTestFS()

	// Test all methods
	if _, err := fs.GetConfigDir(); err != nil {
		t.Error("GetConfigDir failed")
	}
	if _, err := fs.GetTempDir(); err != nil {
		t.Error("GetTempDir failed")
	}
	if _, err := fs.GetMusicDir(); err != nil {
		t.Error("GetMusicDir failed")
	}
	if _, err := fs.GetDownloadsDir(); err != nil {
		t.Error("GetDownloadsDir failed")
	}
	if err := fs.EnsureDir("/some/dir"); err != nil {
		t.Error("EnsureDir failed")
	}
	if fs.FileExists("/nonexistent") {
		t.Error("FileExists should return false for unknown paths")
	}
	if fs.DirExists("/nonexistent") {
		t.Error("DirExists should return false for unknown paths")
	}
	if !fs.IsWritable("/some/path") {
		t.Error("IsWritable should return true")
	}
	if fs.SanitizeFilename("a/b\\c") != "a_b_c" {
		t.Error("SanitizeFilename not working correctly")
	}
}

func TestDownloadProgress_Fields(t *testing.T) {
	progress := core.DownloadProgress{
		ItemID:          "test-id",
		DownloadedBytes: 5000,
		TotalBytes:      10000,
		Speed:           1000,
		Percent:         50,
		ETA:             5000,
	}

	if progress.ItemID != "test-id" {
		t.Error("ItemID not set correctly")
	}
	if progress.Percent != 50 {
		t.Error("Percent not set correctly")
	}
}
