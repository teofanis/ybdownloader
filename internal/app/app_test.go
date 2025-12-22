package app

import (
	"context"
	"testing"

	"ybdownloader/internal/core"
)

// Mock implementations for testing

type mockSettingsStore struct {
	settings  *core.Settings
	saveError error
	loadError error
}

func (m *mockSettingsStore) Load() (*core.Settings, error) {
	if m.loadError != nil {
		return nil, m.loadError
	}
	if m.settings == nil {
		m.settings = core.DefaultSettings("/tmp/test")
	}
	return m.settings, nil
}

func (m *mockSettingsStore) Save(s *core.Settings) error {
	if m.saveError != nil {
		return m.saveError
	}
	m.settings = s
	return nil
}

func (m *mockSettingsStore) Reset() error {
	m.settings = core.DefaultSettings("/tmp/test")
	return nil
}

type mockFileSystem struct {
	configDir string
	tempDir   string
}

func (m *mockFileSystem) GetConfigDir() (string, error) {
	if m.configDir == "" {
		return "/tmp/config", nil
	}
	return m.configDir, nil
}

func (m *mockFileSystem) GetTempDir() (string, error) {
	if m.tempDir == "" {
		return "/tmp", nil
	}
	return m.tempDir, nil
}

func (m *mockFileSystem) GetMusicDir() (string, error) {
	return "/tmp/music", nil
}

func (m *mockFileSystem) GetDownloadsDir() (string, error) {
	return "/tmp/downloads", nil
}

func (m *mockFileSystem) EnsureDir(_ string) error {
	return nil
}

func (m *mockFileSystem) FileExists(_ string) bool {
	return false
}

func (m *mockFileSystem) DirExists(_ string) bool {
	return false
}

func (m *mockFileSystem) IsWritable(_ string) bool {
	return true
}

func (m *mockFileSystem) SanitizeFilename(name string) string {
	return name
}

func TestIsValidYouTubeURL(t *testing.T) {
	tests := []struct {
		name  string
		url   string
		valid bool
	}{
		// Valid URLs
		{
			name:  "standard watch URL",
			url:   "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "watch URL without www",
			url:   "https://youtube.com/watch?v=dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "watch URL without https",
			url:   "http://www.youtube.com/watch?v=dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "short youtu.be URL",
			url:   "https://youtu.be/dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "shorts URL",
			url:   "https://www.youtube.com/shorts/dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "embed URL",
			url:   "https://www.youtube.com/embed/dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "music.youtube.com URL",
			url:   "https://music.youtube.com/watch?v=dQw4w9WgXcQ",
			valid: true,
		},
		{
			name:  "URL with extra params",
			url:   "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest",
			valid: true,
		},

		// Invalid URLs
		{
			name:  "empty string",
			url:   "",
			valid: false,
		},
		{
			name:  "random URL",
			url:   "https://google.com",
			valid: false,
		},
		{
			name:  "youtube.com without video ID",
			url:   "https://www.youtube.com",
			valid: false,
		},
		{
			name:  "invalid video ID (too short)",
			url:   "https://www.youtube.com/watch?v=abc",
			valid: false,
		},
		{
			name:  "playlist URL without video",
			url:   "https://www.youtube.com/playlist?list=PLtest",
			valid: false,
		},
		{
			name:  "channel URL",
			url:   "https://www.youtube.com/@SomeChannel",
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isValidYouTubeURL(tt.url)
			if result != tt.valid {
				t.Errorf("isValidYouTubeURL(%q) = %v, want %v", tt.url, result, tt.valid)
			}
		})
	}
}

func TestGenID(t *testing.T) {
	id1 := genID()
	id2 := genID()

	if id1 == "" {
		t.Error("genID() returned empty string")
	}

	if len(id1) != 32 {
		t.Errorf("genID() returned ID of length %d, want 32", len(id1))
	}

	if id1 == id2 {
		t.Error("genID() returned duplicate IDs")
	}
}

func TestNormalizeURL(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"  https://youtube.com  ", "https://youtube.com"},
		{"https://youtube.com", "https://youtube.com"},
		{"\t\nhttps://youtube.com\n", "https://youtube.com"},
		{"", ""},
		{"   ", ""},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result := normalizeURL(tt.input)
			if result != tt.expected {
				t.Errorf("normalizeURL(%q) = %q, want %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestGetPlatform(t *testing.T) {
	platform := getPlatform()
	if platform == "" {
		t.Error("getPlatform() returned empty string")
	}
	// Should contain a slash separating OS and arch
	if !contains(platform, "/") {
		t.Errorf("getPlatform() = %q, expected format 'os/arch'", platform)
	}
}

func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}

func TestApp_GetSettings(t *testing.T) {
	store := &mockSettingsStore{}
	app := &App{
		settingsStore: store,
	}

	settings, err := app.GetSettings()
	if err != nil {
		t.Fatalf("GetSettings() error = %v", err)
	}

	if settings == nil {
		t.Error("GetSettings() returned nil settings")
	}

	if settings.DefaultFormat != core.FormatMP3 {
		t.Errorf("GetSettings().DefaultFormat = %v, want %v", settings.DefaultFormat, core.FormatMP3)
	}
}

func TestApp_SaveSettings(t *testing.T) {
	store := &mockSettingsStore{}
	app := &App{
		settingsStore: store,
	}

	newSettings := core.DefaultSettings("/new/path")
	newSettings.LogLevel = "debug"

	err := app.SaveSettings(newSettings)
	if err != nil {
		t.Fatalf("SaveSettings() error = %v", err)
	}

	if store.settings.DefaultSavePath != "/new/path" {
		t.Errorf("SaveSettings() did not update settings")
	}
}

func TestApp_ResetSettings(t *testing.T) {
	store := &mockSettingsStore{
		settings: &core.Settings{
			DefaultSavePath: "/custom/path",
			DefaultFormat:   core.FormatMP4,
		},
	}
	app := &App{
		settingsStore: store,
	}

	settings, err := app.ResetSettings()
	if err != nil {
		t.Fatalf("ResetSettings() error = %v", err)
	}

	if settings.DefaultFormat != core.FormatMP3 {
		t.Errorf("ResetSettings() did not reset to defaults, format = %v", settings.DefaultFormat)
	}
}

func TestApp_GetQueue_NilManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	queue := app.GetQueue()
	if queue == nil {
		t.Error("GetQueue() returned nil, expected empty slice")
	}
	if len(queue) != 0 {
		t.Errorf("GetQueue() returned %d items, expected 0", len(queue))
	}
}

func TestApp_AddToQueue_InvalidURL(t *testing.T) {
	store := &mockSettingsStore{}
	app := &App{
		settingsStore: store,
		queueManager:  nil,
	}

	_, err := app.AddToQueue("not-a-youtube-url", "mp3")
	if err != core.ErrInvalidURL {
		t.Errorf("AddToQueue() error = %v, want %v", err, core.ErrInvalidURL)
	}
}

func TestApp_AddToQueue_NilQueueManager(t *testing.T) {
	store := &mockSettingsStore{}
	app := &App{
		settingsStore: store,
		queueManager:  nil,
	}

	_, err := app.AddToQueue("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "mp3")
	if err == nil {
		t.Error("AddToQueue() expected error for nil queue manager")
	}
}

func TestApp_RemoveFromQueue_NilManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	err := app.RemoveFromQueue("some-id")
	if err != core.ErrQueueItemNotFound {
		t.Errorf("RemoveFromQueue() error = %v, want %v", err, core.ErrQueueItemNotFound)
	}
}

func TestApp_StartDownload_NilManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	err := app.StartDownload("some-id")
	if err == nil {
		t.Error("StartDownload() expected error for nil queue manager")
	}
}

func TestApp_StartAllDownloads_NilManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	err := app.StartAllDownloads()
	if err == nil {
		t.Error("StartAllDownloads() expected error for nil queue manager")
	}
}

func TestApp_IsValidYouTubeURL(t *testing.T) {
	app := &App{}

	if !app.IsValidYouTubeURL("https://www.youtube.com/watch?v=dQw4w9WgXcQ") {
		t.Error("IsValidYouTubeURL() returned false for valid URL")
	}

	if app.IsValidYouTubeURL("invalid-url") {
		t.Error("IsValidYouTubeURL() returned true for invalid URL")
	}
}

func TestApp_ImportURLs_NilManager(t *testing.T) {
	store := &mockSettingsStore{}
	app := &App{
		settingsStore: store,
		queueManager:  nil,
	}

	result := app.ImportURLs([]string{"https://youtu.be/test12345ab"}, "mp3")
	if len(result.Errors) == 0 {
		t.Error("ImportURLs() expected error for nil queue manager")
	}
}

func TestApp_Startup_Shutdown(t *testing.T) {
	store := &mockSettingsStore{}
	fs := &mockFileSystem{}
	app := &App{
		settingsStore: store,
		fs:            fs,
		version:       "test-version",
	}

	// Test startup
	ctx := context.Background()
	app.Startup(ctx)

	if app.ctx != ctx {
		t.Error("Startup() did not set context")
	}

	// Test shutdown (should not panic)
	app.Shutdown(ctx)
}

// FFmpegStatus tests
func TestFFmpegStatus_Struct(t *testing.T) {
	status := FFmpegStatus{
		Available:        true,
		Path:             "/usr/bin/ffmpeg",
		Version:          "5.0",
		Bundled:          false,
		FFprobeAvailable: true,
		FFprobePath:      "/usr/bin/ffprobe",
	}

	if !status.Available {
		t.Error("FFmpegStatus.Available should be true")
	}
	if !status.FFprobeAvailable {
		t.Error("FFmpegStatus.FFprobeAvailable should be true")
	}
}

// ImportResult tests
func TestImportResult_Struct(t *testing.T) {
	result := ImportResult{
		Added:   5,
		Skipped: 2,
		Invalid: 1,
		Errors:  []string{"error1"},
	}

	if result.Added != 5 {
		t.Errorf("ImportResult.Added = %d, want 5", result.Added)
	}
	if result.Skipped != 2 {
		t.Errorf("ImportResult.Skipped = %d, want 2", result.Skipped)
	}
	if len(result.Errors) != 1 {
		t.Errorf("ImportResult.Errors length = %d, want 1", len(result.Errors))
	}
}

func TestApp_CancelDownload_NilManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	err := app.CancelDownload("some-id")
	if err == nil {
		t.Error("CancelDownload() expected error for nil queue manager")
	}
}

func TestApp_CancelAllDownloads_NilManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	// CancelAllDownloads returns nil for nil queue manager (graceful handling)
	err := app.CancelAllDownloads()
	if err != nil {
		t.Errorf("CancelAllDownloads() error = %v, expected nil for graceful handling", err)
	}
}

func TestApp_RetryDownload_NilManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	err := app.RetryDownload("some-id")
	if err == nil {
		t.Error("RetryDownload() expected error for nil queue manager")
	}
}

func TestApp_ClearCompleted_NilManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	// Should not panic with nil manager
	app.ClearCompleted()
}

func TestApp_GetConversionPresets(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	// GetConversionPresets returns default presets from core, doesn't depend on service
	presets := app.GetConversionPresets()
	if presets == nil {
		t.Error("GetConversionPresets() returned nil, expected presets slice")
	}
	if len(presets) == 0 {
		t.Error("GetConversionPresets() returned empty slice, expected default presets")
	}
}

func TestApp_GetConversionPresetsByCategory_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	presets := app.GetConversionPresetsByCategory("audio")
	if presets == nil {
		t.Error("GetConversionPresetsByCategory() returned nil, expected empty slice")
	}
	if len(presets) != 0 {
		t.Errorf("GetConversionPresetsByCategory() returned %d items, expected 0", len(presets))
	}
}

func TestApp_AnalyzeMediaFile_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	_, err := app.AnalyzeMediaFile("/some/file.mp3")
	if err == nil {
		t.Error("AnalyzeMediaFile() expected error for nil service")
	}
}

func TestApp_StartConversion_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	_, err := app.StartConversion("/input.mp3", "/output.mp4", "preset-id")
	if err == nil {
		t.Error("StartConversion() expected error for nil service")
	}
}

func TestApp_CancelConversion_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	err := app.CancelConversion("job-id")
	if err == nil {
		t.Error("CancelConversion() expected error for nil service")
	}
}

func TestApp_GetConversionJobs_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	jobs := app.GetConversionJobs()
	if jobs == nil {
		t.Error("GetConversionJobs() returned nil, expected empty slice")
	}
	if len(jobs) != 0 {
		t.Errorf("GetConversionJobs() returned %d items, expected 0", len(jobs))
	}
}

func TestApp_RemoveConversionJob_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	err := app.RemoveConversionJob("job-id")
	if err == nil {
		t.Error("RemoveConversionJob() expected error for nil service")
	}
}

func TestApp_CheckForUpdate_NilUpdater(t *testing.T) {
	app := &App{
		updater: nil,
	}

	_, err := app.CheckForUpdate()
	if err == nil {
		t.Error("CheckForUpdate() expected error for nil updater")
	}
}

func TestApp_DownloadUpdate_NilUpdater(t *testing.T) {
	app := &App{
		updater: nil,
	}

	_, err := app.DownloadUpdate()
	if err == nil {
		t.Error("DownloadUpdate() expected error for nil updater")
	}
}

func TestApp_InstallUpdate_NilUpdater(t *testing.T) {
	app := &App{
		updater: nil,
	}

	err := app.InstallUpdate()
	if err == nil {
		t.Error("InstallUpdate() expected error for nil updater")
	}
}

func TestApp_OpenReleasePage_NilUpdater(t *testing.T) {
	app := &App{
		updater: nil,
	}

	err := app.OpenReleasePage()
	if err == nil {
		t.Error("OpenReleasePage() expected error for nil updater")
	}
}

func TestApp_SearchYouTube_NilSearcher(t *testing.T) {
	app := &App{
		youtubeSearcher: nil,
	}

	_, err := app.SearchYouTube("test query", 10)
	if err == nil {
		t.Error("SearchYouTube() expected error for nil searcher")
	}
}

func TestApp_GetTrendingVideos_NilSearcher(t *testing.T) {
	app := &App{
		youtubeSearcher: nil,
	}

	_, err := app.GetTrendingVideos("US", 10)
	if err == nil {
		t.Error("GetTrendingVideos() expected error for nil searcher")
	}
}
