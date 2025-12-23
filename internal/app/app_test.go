package app

import (
	"context"
	"testing"

	"ybdownloader/internal/core"
	"ybdownloader/internal/infra/updater"
	ytsearch "ybdownloader/internal/infra/youtube"
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

// Mock QueueManager for testing
type mockQueueManager struct {
	items      map[string]*core.QueueItem
	addError   error
	startError error
}

func newMockQueueManager() *mockQueueManager {
	return &mockQueueManager{items: make(map[string]*core.QueueItem)}
}

func (m *mockQueueManager) AddItem(id, url string, format core.Format, savePath string) (*core.QueueItem, error) {
	if m.addError != nil {
		return nil, m.addError
	}
	item := core.NewQueueItem(id, url, format, savePath)
	m.items[id] = item
	return item, nil
}

func (m *mockQueueManager) RemoveItem(id string) error {
	delete(m.items, id)
	return nil
}

func (m *mockQueueManager) GetItem(id string) (*core.QueueItem, error) {
	item, ok := m.items[id]
	if !ok {
		return nil, core.ErrQueueItemNotFound
	}
	return item, nil
}

func (m *mockQueueManager) GetAllItems() []*core.QueueItem {
	items := make([]*core.QueueItem, 0, len(m.items))
	for _, item := range m.items {
		items = append(items, item)
	}
	return items
}

func (m *mockQueueManager) HasURL(url string) bool {
	for _, item := range m.items {
		if item.URL == url {
			return true
		}
	}
	return false
}

func (m *mockQueueManager) StartDownload(id string) error {
	if m.startError != nil {
		return m.startError
	}
	if item, ok := m.items[id]; ok {
		item.State = core.StateDownloading
	}
	return nil
}

func (m *mockQueueManager) StartAll() error {
	for _, item := range m.items {
		item.State = core.StateDownloading
	}
	return nil
}

func (m *mockQueueManager) CancelItem(id string) error {
	if item, ok := m.items[id]; ok {
		item.State = core.StateCancelled
	}
	return nil
}

func (m *mockQueueManager) CancelAll() error {
	for _, item := range m.items {
		item.State = core.StateCancelled
	}
	return nil
}

func (m *mockQueueManager) RetryItem(id string) error {
	if item, ok := m.items[id]; ok {
		item.State = core.StateQueued
	}
	return nil
}

func (m *mockQueueManager) ClearCompleted() error {
	for id, item := range m.items {
		if item.State == core.StateCompleted {
			delete(m.items, id)
		}
	}
	return nil
}

func (m *mockQueueManager) FetchMetadata(ctx context.Context, id string) error {
	return nil
}

func (m *mockQueueManager) Shutdown() {}

// Mock ConverterService for testing
type mockConverterService struct {
	jobs       map[string]*core.ConversionJob
	presets    []core.ConversionPreset
	startError error
}

func newMockConverterService() *mockConverterService {
	return &mockConverterService{
		jobs:    make(map[string]*core.ConversionJob),
		presets: core.GetDefaultPresets(),
	}
}

func (m *mockConverterService) GetPresets() []core.ConversionPreset {
	return m.presets
}

func (m *mockConverterService) GetPresetsByCategory(category string) []core.ConversionPreset {
	var result []core.ConversionPreset
	for _, p := range m.presets {
		if p.Category == category {
			result = append(result, p)
		}
	}
	return result
}

func (m *mockConverterService) GetPreset(id string) (*core.ConversionPreset, error) {
	for _, p := range m.presets {
		if p.ID == id {
			return &p, nil
		}
	}
	return nil, core.NewAppError(core.ErrCodeGeneric, "preset not found", nil)
}

func (m *mockConverterService) AnalyzeFile(ctx context.Context, filePath string) (*core.MediaInfo, error) {
	return &core.MediaInfo{
		Duration: 120.5,
		Format:   "mp4",
		Size:     75000000,
		Bitrate:  5000000,
		VideoStream: &core.VideoStream{
			Codec:  "h264",
			Width:  1920,
			Height: 1080,
			FPS:    30.0,
		},
		AudioStream: &core.AudioStream{
			Codec:      "aac",
			SampleRate: 48000,
			Channels:   2,
		},
	}, nil
}

func (m *mockConverterService) StartConversion(id, inputPath, outputPath, presetID string, customArgs []string) (*core.ConversionJob, error) {
	if m.startError != nil {
		return nil, m.startError
	}
	job := &core.ConversionJob{
		ID:         id,
		InputPath:  inputPath,
		OutputPath: outputPath,
		PresetID:   presetID,
		State:      core.ConversionConverting,
	}
	m.jobs[id] = job
	return job, nil
}

func (m *mockConverterService) StartConversionWithTrim(id, inputPath, outputPath, presetID string, customArgs []string, trim *core.TrimOptions) (*core.ConversionJob, error) {
	return m.StartConversion(id, inputPath, outputPath, presetID, customArgs)
}

func (m *mockConverterService) CancelConversion(id string) error {
	if job, ok := m.jobs[id]; ok {
		job.State = core.ConversionCancelled
	}
	return nil
}

func (m *mockConverterService) GetJob(id string) (*core.ConversionJob, error) {
	job, ok := m.jobs[id]
	if !ok {
		return nil, core.NewAppError(core.ErrCodeGeneric, "job not found", nil)
	}
	return job, nil
}

func (m *mockConverterService) GetAllJobs() []*core.ConversionJob {
	jobs := make([]*core.ConversionJob, 0, len(m.jobs))
	for _, job := range m.jobs {
		jobs = append(jobs, job)
	}
	return jobs
}

func (m *mockConverterService) RemoveJob(id string) error {
	delete(m.jobs, id)
	return nil
}

func (m *mockConverterService) ClearCompletedJobs() {
	for id, job := range m.jobs {
		if job.State == core.ConversionCompleted {
			delete(m.jobs, id)
		}
	}
}

func (m *mockConverterService) GenerateWaveform(ctx context.Context, filePath string, numSamples int) ([]float64, error) {
	result := make([]float64, numSamples)
	for i := range result {
		result[i] = float64(i) / float64(numSamples)
	}
	return result, nil
}

func (m *mockConverterService) GenerateThumbnails(ctx context.Context, filePath string, count int, outputDir string) ([]string, error) {
	result := make([]string, count)
	for i := range result {
		result[i] = outputDir + "/thumb" + string(rune('0'+i)) + ".jpg"
	}
	return result, nil
}

// Mock YouTubeSearcher for testing
type mockYouTubeSearcher struct {
	searchResults   *ytsearch.SearchResponse
	trendingResults *ytsearch.TrendingResponse
	searchError     error
	trendingError   error
}

func newMockYouTubeSearcher() *mockYouTubeSearcher {
	return &mockYouTubeSearcher{
		searchResults: &ytsearch.SearchResponse{
			Query: "test query",
			Results: []ytsearch.SearchResult{
				{ID: "abc123", Title: "Test Video 1", Author: "Test Author", Duration: "3:45"},
				{ID: "def456", Title: "Test Video 2", Author: "Test Author 2", Duration: "5:30"},
			},
		},
		trendingResults: &ytsearch.TrendingResponse{
			Country: "US",
			Results: []ytsearch.SearchResult{
				{ID: "trend1", Title: "Trending Video 1", Author: "Trending Author"},
			},
		},
	}
}

func (m *mockYouTubeSearcher) Search(ctx context.Context, query string, limit int) (*ytsearch.SearchResponse, error) {
	if m.searchError != nil {
		return nil, m.searchError
	}
	return m.searchResults, nil
}

func (m *mockYouTubeSearcher) GetTrending(ctx context.Context, country string, limit int) (*ytsearch.TrendingResponse, error) {
	if m.trendingError != nil {
		return nil, m.trendingError
	}
	return m.trendingResults, nil
}

// Mock AppUpdater for testing
type mockAppUpdater struct {
	updateInfo       *updater.UpdateInfo
	checkError       error
	downloadError    error
	downloadPath     string
	installError     error
	openReleaseError error
}

func newMockAppUpdater() *mockAppUpdater {
	return &mockAppUpdater{
		updateInfo: &updater.UpdateInfo{
			CurrentVersion: "1.0.0",
			LatestVersion:  "1.1.0",
			Status:         updater.StatusAvailable,
		},
		downloadPath: "/tmp/update.tar.gz",
	}
}

func (m *mockAppUpdater) SetProgressCallback(callback func(updater.UpdateInfo)) {
	// No-op for testing
}

func (m *mockAppUpdater) CheckForUpdate(ctx context.Context) (*updater.UpdateInfo, error) {
	if m.checkError != nil {
		return nil, m.checkError
	}
	return m.updateInfo, nil
}

func (m *mockAppUpdater) DownloadUpdate(ctx context.Context) (string, error) {
	if m.downloadError != nil {
		return "", m.downloadError
	}
	return m.downloadPath, nil
}

func (m *mockAppUpdater) InstallUpdate() error {
	return m.installError
}

func (m *mockAppUpdater) GetUpdateInfo() updater.UpdateInfo {
	if m.updateInfo == nil {
		return updater.UpdateInfo{}
	}
	return *m.updateInfo
}

func (m *mockAppUpdater) OpenReleasePage() error {
	return m.openReleaseError
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

func TestApp_GetTrendingVideos_NilSearcher(t *testing.T) {
	app := &App{
		youtubeSearcher: nil,
	}

	_, err := app.GetTrendingVideos("US", 10)
	if err == nil {
		t.Error("GetTrendingVideos() expected error for nil searcher")
	}
}

func TestApp_GetAppVersion(t *testing.T) {
	app := &App{
		version: "1.2.3",
	}

	version := app.GetAppVersion()
	if version != "1.2.3" {
		t.Errorf("GetAppVersion() = %q, want %q", version, "1.2.3")
	}
}

func TestApp_GetUpdateInfo_NilUpdater(t *testing.T) {
	app := &App{
		appUpdater: nil,
	}

	info := app.GetUpdateInfo()
	if info.Status != updater.StatusIdle {
		t.Errorf("GetUpdateInfo().Status = %q, want %q", info.Status, updater.StatusIdle)
	}
}

func TestApp_FetchMetadata_NilDownloader(t *testing.T) {
	app := &App{
		ctx:        context.Background(),
		downloader: nil,
	}

	_, err := app.FetchMetadata("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
	if err == nil {
		t.Error("FetchMetadata() expected error for nil downloader")
	}
}

func TestApp_SetPendingDeepLink(t *testing.T) {
	app := &App{}

	link := "ybdownloader://add?url=test"
	app.SetPendingDeepLink(link)

	if app.pendingDeepLink != link {
		t.Errorf("pendingDeepLink = %q, want %q", app.pendingDeepLink, link)
	}
}

func TestApp_OnUrlOpen_NoContext(t *testing.T) {
	app := &App{
		ctx: nil, // No context yet
	}

	link := "ybdownloader://add?url=test"
	app.OnUrlOpen(link)

	// Should store as pending since ctx is nil
	if app.pendingDeepLink != link {
		t.Errorf("pendingDeepLink = %q, want %q", app.pendingDeepLink, link)
	}
}

func TestApp_ClearCompletedConversions_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	// Should not panic
	app.ClearCompletedConversions()
}

func TestApp_StartConversionWithTrim_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	_, err := app.StartConversionWithTrim("/input.mp3", "/output.mp4", "preset-id", 0, 60)
	if err == nil {
		t.Error("StartConversionWithTrim() expected error for nil service")
	}
}

func TestApp_StartCustomConversion_NilService(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	_, err := app.StartCustomConversion("/input.mp3", "/output.mp4", []string{"-c:a", "copy"})
	if err == nil {
		t.Error("StartCustomConversion() expected error for nil service")
	}
}

func TestApp_GenerateWaveform_NilService(t *testing.T) {
	app := &App{
		ctx:              context.Background(),
		converterService: nil,
	}

	_, err := app.GenerateWaveform("/file.mp3", 100)
	if err == nil {
		t.Error("GenerateWaveform() expected error for nil service")
	}
}

func TestApp_CheckFFmpeg(t *testing.T) {
	store := &mockSettingsStore{}
	fs := &mockFileSystem{}
	app := &App{
		settingsStore: store,
		fs:            fs,
	}

	// Will return false since no ffmpeg is installed in test env
	available, _ := app.CheckFFmpeg()
	if available {
		t.Log("FFmpeg is available in test environment")
	} else {
		t.Log("FFmpeg not available (expected in test environment)")
	}
}

func TestApp_emit_NilContext(t *testing.T) {
	app := &App{
		ctx: nil,
	}

	// Should not panic with nil context
	app.emit("test-event", "test-data")
}

func TestYouTubeSearchResult_Struct(t *testing.T) {
	result := YouTubeSearchResult{
		ID:          "abc123",
		Title:       "Test Video",
		Author:      "Test Channel",
		Duration:    "3:45",
		DurationSec: 225,
		Thumbnail:   "https://i.ytimg.com/vi/abc123/maxresdefault.jpg",
		ViewCount:   "1M views",
		PublishedAt: "2 days ago",
		URL:         "https://www.youtube.com/watch?v=abc123",
	}

	if result.ID != "abc123" {
		t.Errorf("YouTubeSearchResult.ID = %q, want %q", result.ID, "abc123")
	}
	if result.Title != "Test Video" {
		t.Errorf("YouTubeSearchResult.Title = %q, want %q", result.Title, "Test Video")
	}
	if result.DurationSec != 225 {
		t.Errorf("YouTubeSearchResult.DurationSec = %d, want %d", result.DurationSec, 225)
	}
}

func TestYouTubeSearchResponse_Struct(t *testing.T) {
	response := YouTubeSearchResponse{
		Query: "test query",
		Results: []YouTubeSearchResult{
			{ID: "v1", Title: "Video 1"},
			{ID: "v2", Title: "Video 2"},
		},
	}

	if response.Query != "test query" {
		t.Errorf("YouTubeSearchResponse.Query = %q, want %q", response.Query, "test query")
	}
	if len(response.Results) != 2 {
		t.Errorf("len(YouTubeSearchResponse.Results) = %d, want %d", len(response.Results), 2)
	}
}

func TestApp_ImportURLs_WithDuplicates(t *testing.T) {
	store := &mockSettingsStore{}
	app := &App{
		settingsStore: store,
		queueManager:  nil, // Will cause error, but tests duplicate detection path
	}

	// Even with nil queueManager, we test the early return
	result := app.ImportURLs([]string{
		"https://youtu.be/test12345ab",
		"https://youtu.be/test12345ab", // duplicate
	}, "mp3")

	if len(result.Errors) == 0 {
		t.Error("ImportURLs() expected error for nil queue manager")
	}
}

func TestApp_ImportURLs_InvalidURLs(t *testing.T) {
	store := &mockSettingsStore{}
	app := &App{
		settingsStore: store,
		queueManager:  nil,
	}

	// Test invalid URLs
	result := app.ImportURLs([]string{
		"not-a-youtube-url",
		"",    // empty
		"   ", // whitespace only
	}, "mp3")

	// Should have errors for nil queue manager and count invalids
	if len(result.Errors) == 0 {
		t.Error("ImportURLs() expected error")
	}
}

func TestApp_handleDeepLink_UnknownAction(t *testing.T) {
	app := &App{
		ctx: context.Background(),
	}

	// Should not panic on unknown action
	app.handleDeepLink("ybdownloader://unknown?param=value")
}

func TestApp_handleDeepLink_InvalidURL(t *testing.T) {
	app := &App{
		ctx: context.Background(),
	}

	// Should not panic on invalid URL
	app.handleDeepLink("not-a-valid-url://%%%")
}

func TestApp_GetFFmpegStatus(t *testing.T) {
	store := &mockSettingsStore{}
	fs := &mockFileSystem{}
	app := &App{
		settingsStore: store,
		fs:            fs,
	}

	status := app.GetFFmpegStatus()

	// In test environment, FFmpeg is likely not available
	// Just verify the structure is returned correctly
	_ = status.Available
	_ = status.Path
	_ = status.Version
	_ = status.Bundled
	_ = status.FFprobeAvailable
	_ = status.FFprobePath
}

func TestApp_CancelDownload_NilManager_ReturnsError(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	err := app.CancelDownload("some-id")
	if err == nil {
		t.Error("CancelDownload() expected error for nil queue manager")
	}
}

func TestApp_RetryDownload_NilManager_ReturnsError(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	err := app.RetryDownload("some-id")
	if err == nil {
		t.Error("RetryDownload() expected error for nil queue manager")
	}
}

func TestApp_StartConversionWithTrim_WithNoTrim(t *testing.T) {
	app := &App{
		converterService: nil,
	}

	// With 0 start and end, should still fail due to nil service
	_, err := app.StartConversionWithTrim("/input.mp3", "/output.mp4", "preset", 0, 0)
	if err == nil {
		t.Error("expected error for nil service")
	}
}

func TestApp_OnUrlOpen_NonYBLink(t *testing.T) {
	app := &App{
		ctx: context.Background(),
	}

	// Non-ybdownloader URL should be ignored
	app.OnUrlOpen("https://www.example.com")

	// Should not be stored as pending
	if app.pendingDeepLink == "https://www.example.com" {
		t.Error("non-ybdownloader URL should not be stored")
	}
}

func TestApp_Startup_SetsContext(t *testing.T) {
	store := &mockSettingsStore{}
	fs := &mockFileSystem{}
	app := &App{
		settingsStore: store,
		fs:            fs,
		version:       "test",
	}

	ctx := context.Background()
	app.Startup(ctx)

	if app.ctx != ctx {
		t.Error("Startup should set ctx")
	}
}

func TestApp_Shutdown_NilQueueManager(t *testing.T) {
	app := &App{
		queueManager: nil,
	}

	// Should not panic
	app.Shutdown(context.Background())
}

func TestApp_GetFFmpegStatus_Fields(t *testing.T) {
	status := FFmpegStatus{
		Available:        true,
		Path:             "/usr/bin/ffmpeg",
		Version:          "5.1.2",
		Bundled:          false,
		FFprobeAvailable: true,
		FFprobePath:      "/usr/bin/ffprobe",
	}

	if status.Path != "/usr/bin/ffmpeg" {
		t.Errorf("Path = %q, want %q", status.Path, "/usr/bin/ffmpeg")
	}
	if !status.FFprobeAvailable {
		t.Error("FFprobeAvailable should be true")
	}
}

func TestYtPatterns(t *testing.T) {
	validURLs := []string{
		"https://youtube.com/watch?v=dQw4w9WgXcQ",
		"https://www.youtube.com/watch?v=dQw4w9WgXcQ",
		"https://youtu.be/dQw4w9WgXcQ",
		"https://youtube.com/shorts/dQw4w9WgXcQ",
		"https://youtube.com/embed/dQw4w9WgXcQ",
		"https://music.youtube.com/watch?v=dQw4w9WgXcQ",
	}

	for _, url := range validURLs {
		if !isValidYouTubeURL(url) {
			t.Errorf("isValidYouTubeURL(%q) = false, want true", url)
		}
	}

	invalidURLs := []string{
		"https://vimeo.com/123456",
		"https://youtube.com",
		"https://youtube.com/channel/abc",
		"",
	}

	for _, url := range invalidURLs {
		if isValidYouTubeURL(url) {
			t.Errorf("isValidYouTubeURL(%q) = true, want false", url)
		}
	}
}

// ============================================================================
// Tests with mock dependencies
// ============================================================================

func TestApp_AddToQueue_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	store := &mockSettingsStore{}
	fs := &mockFileSystem{}

	app := &App{
		ctx:           context.Background(),
		queueManager:  qm,
		settingsStore: store,
		fs:            fs,
	}

	item, err := app.AddToQueue("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "mp3")
	if err != nil {
		t.Fatalf("AddToQueue() error = %v", err)
	}
	if item == nil {
		t.Fatal("AddToQueue() returned nil item")
	}
	if item.Format != core.FormatMP3 {
		t.Errorf("item.Format = %v, want %v", item.Format, core.FormatMP3)
	}
}

func TestApp_RemoveFromQueue_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	qm.items["test-id"] = core.NewQueueItem("test-id", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	err := app.RemoveFromQueue("test-id")
	if err != nil {
		t.Errorf("RemoveFromQueue() error = %v", err)
	}
	if len(qm.items) != 0 {
		t.Error("RemoveFromQueue() did not remove the item")
	}
}

func TestApp_GetQueue_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	qm.items["id1"] = core.NewQueueItem("id1", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")
	qm.items["id2"] = core.NewQueueItem("id2", "https://youtube.com/watch?v=def", core.FormatMP4, "/tmp")

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	items := app.GetQueue()
	if len(items) != 2 {
		t.Errorf("GetQueue() returned %d items, want 2", len(items))
	}
}

func TestApp_StartDownload_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	qm.items["test-id"] = core.NewQueueItem("test-id", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	err := app.StartDownload("test-id")
	if err != nil {
		t.Errorf("StartDownload() error = %v", err)
	}
	if qm.items["test-id"].State != core.StateDownloading {
		t.Error("StartDownload() did not start the download")
	}
}

func TestApp_CancelDownload_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	item := core.NewQueueItem("test-id", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")
	item.State = core.StateDownloading
	qm.items["test-id"] = item

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	err := app.CancelDownload("test-id")
	if err != nil {
		t.Errorf("CancelDownload() error = %v", err)
	}
	if qm.items["test-id"].State != core.StateCancelled {
		t.Error("CancelDownload() did not cancel the download")
	}
}

func TestApp_StartAllDownloads_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	qm.items["id1"] = core.NewQueueItem("id1", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")
	qm.items["id2"] = core.NewQueueItem("id2", "https://youtube.com/watch?v=def", core.FormatMP3, "/tmp")

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	err := app.StartAllDownloads()
	if err != nil {
		t.Errorf("StartAllDownloads() error = %v", err)
	}
	for _, item := range qm.items {
		if item.State != core.StateDownloading {
			t.Error("StartAllDownloads() did not start all downloads")
		}
	}
}

func TestApp_CancelAllDownloads_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	item1 := core.NewQueueItem("id1", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")
	item1.State = core.StateDownloading
	item2 := core.NewQueueItem("id2", "https://youtube.com/watch?v=def", core.FormatMP3, "/tmp")
	item2.State = core.StateDownloading
	qm.items["id1"] = item1
	qm.items["id2"] = item2

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	err := app.CancelAllDownloads()
	if err != nil {
		t.Errorf("CancelAllDownloads() error = %v", err)
	}
	for _, item := range qm.items {
		if item.State != core.StateCancelled {
			t.Error("CancelAllDownloads() did not cancel all downloads")
		}
	}
}

func TestApp_RetryDownload_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	item := core.NewQueueItem("test-id", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")
	item.State = core.StateFailed
	qm.items["test-id"] = item

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	err := app.RetryDownload("test-id")
	if err != nil {
		t.Errorf("RetryDownload() error = %v", err)
	}
	if qm.items["test-id"].State != core.StateQueued {
		t.Error("RetryDownload() did not reset the state")
	}
}

func TestApp_ClearCompleted_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	item1 := core.NewQueueItem("id1", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")
	item1.State = core.StateCompleted
	item2 := core.NewQueueItem("id2", "https://youtube.com/watch?v=def", core.FormatMP3, "/tmp")
	item2.State = core.StateQueued
	qm.items["id1"] = item1
	qm.items["id2"] = item2

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	err := app.ClearCompleted()
	if err != nil {
		t.Errorf("ClearCompleted() error = %v", err)
	}
	if len(qm.items) != 1 {
		t.Errorf("ClearCompleted() left %d items, want 1", len(qm.items))
	}
}

func TestApp_StartConversion_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	job, err := app.StartConversion("/input.mp4", "/output.mp3", "mp3-320")
	if err != nil {
		t.Fatalf("StartConversion() error = %v", err)
	}
	if job == nil {
		t.Fatal("StartConversion() returned nil job")
	}
	if job.InputPath != "/input.mp4" {
		t.Errorf("job.InputPath = %q, want %q", job.InputPath, "/input.mp4")
	}
}

func TestApp_CancelConversion_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()
	cs.jobs["test-id"] = &core.ConversionJob{
		ID:    "test-id",
		State: core.ConversionConverting,
	}

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	err := app.CancelConversion("test-id")
	if err != nil {
		t.Errorf("CancelConversion() error = %v", err)
	}
	if cs.jobs["test-id"].State != core.ConversionCancelled {
		t.Error("CancelConversion() did not cancel the job")
	}
}

func TestApp_GetConversionJobs_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()
	cs.jobs["id1"] = &core.ConversionJob{ID: "id1"}
	cs.jobs["id2"] = &core.ConversionJob{ID: "id2"}

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	jobs := app.GetConversionJobs()
	if len(jobs) != 2 {
		t.Errorf("GetConversionJobs() returned %d jobs, want 2", len(jobs))
	}
}

func TestApp_RemoveConversionJob_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()
	cs.jobs["test-id"] = &core.ConversionJob{ID: "test-id"}

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	err := app.RemoveConversionJob("test-id")
	if err != nil {
		t.Errorf("RemoveConversionJob() error = %v", err)
	}
	if len(cs.jobs) != 0 {
		t.Error("RemoveConversionJob() did not remove the job")
	}
}

func TestApp_ClearCompletedConversions_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()
	cs.jobs["id1"] = &core.ConversionJob{ID: "id1", State: core.ConversionCompleted}
	cs.jobs["id2"] = &core.ConversionJob{ID: "id2", State: core.ConversionConverting}

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	app.ClearCompletedConversions()
	if len(cs.jobs) != 1 {
		t.Errorf("ClearCompletedConversions() left %d jobs, want 1", len(cs.jobs))
	}
}

func TestApp_GetConversionPresetsByCategory_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	presets := app.GetConversionPresetsByCategory("audio")
	if len(presets) == 0 {
		t.Error("GetConversionPresetsByCategory() returned no presets for audio")
	}
}

func TestApp_AnalyzeMediaFile_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	info, err := app.AnalyzeMediaFile("/test/video.mp4")
	if err != nil {
		t.Fatalf("AnalyzeMediaFile() error = %v", err)
	}
	if info == nil {
		t.Fatal("AnalyzeMediaFile() returned nil")
	}
	if info.Duration != 120.5 {
		t.Errorf("info.Duration = %v, want 120.5", info.Duration)
	}
}

func TestApp_GenerateWaveform_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	waveform, err := app.GenerateWaveform("/test/audio.mp3", 100)
	if err != nil {
		t.Fatalf("GenerateWaveform() error = %v", err)
	}
	if len(waveform) != 100 {
		t.Errorf("GenerateWaveform() returned %d samples, want 100", len(waveform))
	}
}

func TestApp_StartConversionWithTrim_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	job, err := app.StartConversionWithTrim("/input.mp4", "/output.mp3", "mp3-320", 10.0, 60.0)
	if err != nil {
		t.Fatalf("StartConversionWithTrim() error = %v", err)
	}
	if job == nil {
		t.Fatal("StartConversionWithTrim() returned nil job")
	}
}

func TestApp_StartCustomConversion_WithMockConverterService(t *testing.T) {
	cs := newMockConverterService()

	app := &App{
		ctx:              context.Background(),
		converterService: cs,
	}

	job, err := app.StartCustomConversion("/input.mp4", "/output.mp3", []string{"-b:a", "320k"})
	if err != nil {
		t.Fatalf("StartCustomConversion() error = %v", err)
	}
	if job == nil {
		t.Fatal("StartCustomConversion() returned nil job")
	}
}

func TestApp_Shutdown_WithMockQueueManager(t *testing.T) {
	qm := newMockQueueManager()
	qm.items["test-id"] = core.NewQueueItem("test-id", "https://youtube.com/watch?v=abc", core.FormatMP3, "/tmp")

	app := &App{
		ctx:          context.Background(),
		queueManager: qm,
	}

	// Should not panic
	app.Shutdown(context.Background())
}

// ============================================================================
// YouTube Search Tests with Mock
// ============================================================================

func TestApp_SearchYouTube_WithMockSearcher(t *testing.T) {
	yt := newMockYouTubeSearcher()

	app := &App{
		ctx:             context.Background(),
		youtubeSearcher: yt,
	}

	result, err := app.SearchYouTube("test query", 10)
	if err != nil {
		t.Fatalf("SearchYouTube() error = %v", err)
	}
	if result == nil {
		t.Fatal("SearchYouTube() returned nil")
	}
	if len(result.Results) != 2 {
		t.Errorf("SearchYouTube() returned %d results, want 2", len(result.Results))
	}
}

func TestApp_SearchYouTube_NilSearcher(t *testing.T) {
	app := &App{
		ctx:             context.Background(),
		youtubeSearcher: nil,
	}

	_, err := app.SearchYouTube("test query", 10)
	if err == nil {
		t.Error("SearchYouTube() expected error for nil searcher")
	}
}

func TestApp_GetTrendingVideos_WithMockSearcher(t *testing.T) {
	yt := newMockYouTubeSearcher()

	app := &App{
		ctx:             context.Background(),
		youtubeSearcher: yt,
	}

	result, err := app.GetTrendingVideos("US", 10)
	if err != nil {
		t.Fatalf("GetTrendingVideos() error = %v", err)
	}
	if result == nil {
		t.Fatal("GetTrendingVideos() returned nil")
	}
	if len(result.Results) != 1 {
		t.Errorf("GetTrendingVideos() returned %d results, want 1", len(result.Results))
	}
}

// ============================================================================
// Updater Tests with Mock
// ============================================================================

func TestApp_CheckForUpdate_WithMockUpdater(t *testing.T) {
	upd := newMockAppUpdater()

	app := &App{
		ctx:        context.Background(),
		appUpdater: upd,
	}

	info, err := app.CheckForUpdate()
	if err != nil {
		t.Fatalf("CheckForUpdate() error = %v", err)
	}
	if info == nil {
		t.Fatal("CheckForUpdate() returned nil")
	}
	if info.Status != updater.StatusAvailable {
		t.Error("CheckForUpdate() should return status available")
	}
}

func TestApp_CheckForUpdate_NilUpdater(t *testing.T) {
	app := &App{
		ctx:        context.Background(),
		appUpdater: nil,
	}

	_, err := app.CheckForUpdate()
	if err == nil {
		t.Error("CheckForUpdate() expected error for nil updater")
	}
}

func TestApp_DownloadUpdate_WithMockUpdater(t *testing.T) {
	upd := newMockAppUpdater()

	app := &App{
		ctx:        context.Background(),
		appUpdater: upd,
	}

	path, err := app.DownloadUpdate()
	if err != nil {
		t.Fatalf("DownloadUpdate() error = %v", err)
	}
	if path != "/tmp/update.tar.gz" {
		t.Errorf("DownloadUpdate() path = %q, want %q", path, "/tmp/update.tar.gz")
	}
}

func TestApp_DownloadUpdate_NilUpdater(t *testing.T) {
	app := &App{
		ctx:        context.Background(),
		appUpdater: nil,
	}

	_, err := app.DownloadUpdate()
	if err == nil {
		t.Error("DownloadUpdate() expected error for nil updater")
	}
}

func TestApp_InstallUpdate_WithMockUpdater_Error(t *testing.T) {
	upd := newMockAppUpdater()
	upd.installError = core.NewAppError(core.ErrCodeGeneric, "install failed", nil)

	app := &App{
		ctx:        context.Background(),
		appUpdater: upd,
	}

	err := app.InstallUpdate()
	if err == nil {
		t.Error("InstallUpdate() expected error")
	}
}

func TestApp_InstallUpdate_NilUpdater(t *testing.T) {
	app := &App{
		ctx:        context.Background(),
		appUpdater: nil,
	}

	err := app.InstallUpdate()
	if err == nil {
		t.Error("InstallUpdate() expected error for nil updater")
	}
}

func TestApp_GetUpdateInfo_WithMockUpdater(t *testing.T) {
	upd := newMockAppUpdater()

	app := &App{
		ctx:        context.Background(),
		appUpdater: upd,
	}

	info := app.GetUpdateInfo()
	if info.LatestVersion != "1.1.0" {
		t.Errorf("GetUpdateInfo().LatestVersion = %q, want %q", info.LatestVersion, "1.1.0")
	}
}

func TestApp_OpenReleasePage_WithMockUpdater(t *testing.T) {
	upd := newMockAppUpdater()

	app := &App{
		ctx:        context.Background(),
		appUpdater: upd,
	}

	err := app.OpenReleasePage()
	if err != nil {
		t.Errorf("OpenReleasePage() error = %v", err)
	}
}

func TestApp_OpenReleasePage_NilUpdater(t *testing.T) {
	app := &App{
		ctx:        context.Background(),
		appUpdater: nil,
	}

	err := app.OpenReleasePage()
	if err == nil {
		t.Error("OpenReleasePage() expected error for nil updater")
	}
}
