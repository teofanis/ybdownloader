package app

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"regexp"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"

	"ybdownloader/internal/core"
	"ybdownloader/internal/infra/converter"
	"ybdownloader/internal/infra/downloader"
	"ybdownloader/internal/infra/fs"
	"ybdownloader/internal/infra/queue"
	"ybdownloader/internal/infra/settings"
	"ybdownloader/internal/infra/updater"
	ytsearch "ybdownloader/internal/infra/youtube"
)

// App is the main Wails application, exposed to the frontend.
type App struct {
	ctx              context.Context
	version          string
	fs               core.FileSystem
	settingsStore    core.SettingsStore
	downloader       core.Downloader
	queueManager     *queue.Manager
	converterService *converter.Service
	youtubeSearcher  *ytsearch.Searcher
	updater          *updater.Updater
}

func New(version string) (*App, error) {
	filesystem := fs.New()
	store, err := settings.NewStore(filesystem)
	if err != nil {
		return nil, err
	}

	getSettings := func() (*core.Settings, error) {
		return store.Load()
	}

	dl, err := downloader.New(filesystem, getSettings)
	if err != nil {
		// Log warning but continue - downloader may work partially
		dl = nil
	}

	app := &App{
		version:       version,
		fs:            filesystem,
		settingsStore: store,
		downloader:    dl,
		updater:       updater.NewUpdater(version),
	}

	// Queue manager needs emit function, will be set after ctx is available
	return app, nil
}

// Startup is called by Wails when the app launches.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx

	// Initialize queue manager with emit function
	if a.downloader != nil {
		a.queueManager = queue.New(a.downloader, a.settingsStore.Load, a.emit)
	}

	// Initialize converter service
	ffmpegManager := downloader.NewFFmpegManager(a.fs, a.settingsStore.Load, a.settingsStore.Save)
	if ffmpegPath, err := ffmpegManager.GetFFmpegPath(); err == nil {
		a.converterService = converter.New(ffmpegPath, a.emit)
	}

	// Initialize YouTube searcher
	a.youtubeSearcher = ytsearch.NewSearcher()
}

// Shutdown stops active downloads gracefully.
func (a *App) Shutdown(_ context.Context) {
	if a.queueManager != nil {
		a.queueManager.Shutdown()
	}
}

func (a *App) GetSettings() (*core.Settings, error) {
	return a.settingsStore.Load()
}

func (a *App) SaveSettings(s *core.Settings) error {
	return a.settingsStore.Save(s)
}

func (a *App) ResetSettings() (*core.Settings, error) {
	if err := a.settingsStore.Reset(); err != nil {
		return nil, err
	}
	return a.settingsStore.Load()
}

func (a *App) AddToQueue(url string, format string) (*core.QueueItem, error) {
	if !isValidYouTubeURL(url) {
		return nil, core.ErrInvalidURL
	}

	s, err := a.settingsStore.Load()
	if err != nil {
		return nil, err
	}

	if a.queueManager == nil {
		return nil, core.NewAppError(core.ErrCodeDownloadFailed, "Downloader not initialized", nil)
	}

	return a.queueManager.AddItem(genID(), url, core.Format(format), s.DefaultSavePath)
}

type ImportResult struct {
	Added   int      `json:"added"`
	Skipped int      `json:"skipped"`
	Invalid int      `json:"invalid"`
	Errors  []string `json:"errors,omitempty"`
}

func (a *App) ImportURLs(urls []string, format string) ImportResult {
	result := ImportResult{}

	if a.queueManager == nil {
		result.Errors = append(result.Errors, "Downloader not initialized")
		return result
	}

	s, err := a.settingsStore.Load()
	if err != nil {
		result.Errors = append(result.Errors, err.Error())
		return result
	}

	seen := make(map[string]bool)
	for _, url := range urls {
		url = normalizeURL(url)
		if url == "" {
			continue
		}

		// Validate YouTube URL
		if !isValidYouTubeURL(url) {
			result.Invalid++
			continue
		}

		// Deduplicate within batch
		if seen[url] {
			result.Skipped++
			continue
		}
		seen[url] = true

		// Check if already in queue
		if a.queueManager.HasURL(url) {
			result.Skipped++
			continue
		}

		// Add to queue
		_, err := a.queueManager.AddItem(genID(), url, core.Format(format), s.DefaultSavePath)
		if err != nil {
			result.Skipped++
			continue
		}
		result.Added++
	}

	return result
}

// IsValidYouTubeURL checks if a URL is a valid YouTube URL (exposed to frontend).
func (a *App) IsValidYouTubeURL(url string) bool {
	return isValidYouTubeURL(url)
}

// normalizeURL cleans up a URL string.
func normalizeURL(url string) string {
	// Trim whitespace
	url = strings.TrimSpace(url)
	return url
}

// RemoveFromQueue removes an item from the queue.
func (a *App) RemoveFromQueue(id string) error {
	if a.queueManager == nil {
		return core.ErrQueueItemNotFound
	}
	return a.queueManager.RemoveItem(id)
}

// GetQueue returns all queue items.
func (a *App) GetQueue() []*core.QueueItem {
	if a.queueManager == nil {
		return []*core.QueueItem{}
	}
	return a.queueManager.GetAllItems()
}

// StartDownload starts downloading a specific item.
func (a *App) StartDownload(id string) error {
	if a.queueManager == nil {
		return core.NewAppError(core.ErrCodeDownloadFailed, "Downloader not initialized", nil)
	}
	return a.queueManager.StartDownload(id)
}

// StartAllDownloads starts all pending downloads.
func (a *App) StartAllDownloads() error {
	if a.queueManager == nil {
		return core.NewAppError(core.ErrCodeDownloadFailed, "Downloader not initialized", nil)
	}
	return a.queueManager.StartAll()
}

// CancelDownload cancels a specific download.
func (a *App) CancelDownload(id string) error {
	if a.queueManager == nil {
		return core.ErrQueueItemNotFound
	}
	return a.queueManager.CancelItem(id)
}

// CancelAllDownloads cancels all active downloads.
func (a *App) CancelAllDownloads() error {
	if a.queueManager == nil {
		return nil
	}
	return a.queueManager.CancelAll()
}

// RetryDownload retries a failed download.
func (a *App) RetryDownload(id string) error {
	if a.queueManager == nil {
		return core.ErrQueueItemNotFound
	}
	return a.queueManager.RetryItem(id)
}

// ClearCompleted removes all completed items from the queue.
func (a *App) ClearCompleted() error {
	if a.queueManager == nil {
		return nil
	}
	return a.queueManager.ClearCompleted()
}

// FetchMetadata fetches video metadata for a URL.
func (a *App) FetchMetadata(url string) (*core.VideoMetadata, error) {
	if a.downloader == nil {
		return nil, core.NewAppError(core.ErrCodeDownloadFailed, "Downloader not initialized", nil)
	}
	return a.downloader.FetchMetadata(a.ctx, url)
}

// SelectDirectory opens a native directory picker dialog.
func (a *App) SelectDirectory() (string, error) {
	return runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Select Download Folder",
	})
}

// OpenFile opens a file with the default system application.
func (a *App) OpenFile(path string) error {
	return openWithDefaultApp(path)
}

// OpenFolder opens a folder in the system file manager.
func (a *App) OpenFolder(path string) error {
	return openInFileManager(path)
}

// FFmpegStatus represents the current FFmpeg and FFprobe status.
type FFmpegStatus struct {
	Available        bool   `json:"available"`
	Path             string `json:"path"`
	Version          string `json:"version"`
	Bundled          bool   `json:"bundled"`          // True if using bundled FFmpeg
	FFprobeAvailable bool   `json:"ffprobeAvailable"` // True if FFprobe is available
	FFprobePath      string `json:"ffprobePath"`      // Path to FFprobe binary
}

// GetFFmpegStatus checks FFmpeg and FFprobe availability and returns detailed status.
func (a *App) GetFFmpegStatus() FFmpegStatus {
	manager := downloader.NewFFmpegManager(a.fs, a.settingsStore.Load, a.settingsStore.Save)

	status := FFmpegStatus{Available: false, FFprobeAvailable: false}

	// Check FFmpeg
	ffmpegPath, err := manager.GetFFmpegPath()
	if err == nil {
		ffmpeg, err := downloader.NewFFmpeg(ffmpegPath)
		if err == nil {
			status.Available = true
			status.Path = ffmpegPath
			status.Version, _ = ffmpeg.GetVersion(context.Background())

			// Check if it's bundled (in our config dir)
			configDir, _ := a.fs.GetConfigDir()
			status.Bundled = strings.HasPrefix(ffmpegPath, configDir)
		}
	}

	// Check FFprobe
	ffprobePath, err := manager.GetFFprobePath()
	if err == nil {
		status.FFprobeAvailable = true
		status.FFprobePath = ffprobePath
	}

	return status
}

// DownloadFFmpeg downloads and installs FFmpeg for the current platform.
func (a *App) DownloadFFmpeg() error {
	manager := downloader.NewFFmpegManager(a.fs, a.settingsStore.Load, a.settingsStore.Save)

	return manager.DownloadFFmpeg(a.ctx, func(percent float64, status string) {
		a.emit("ffmpeg:progress", map[string]interface{}{
			"percent": percent,
			"status":  status,
		})
	})
}

// CheckFFmpeg checks if FFmpeg is available (legacy, for compatibility).
func (a *App) CheckFFmpeg() (bool, string) {
	status := a.GetFFmpegStatus()
	return status.Available, status.Version
}

// emit sends an event to the frontend.
func (a *App) emit(event string, data interface{}) {
	if a.ctx != nil {
		runtime.EventsEmit(a.ctx, event, data)
	}
}

// genID generates a unique ID for queue items.
func genID() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b) // crypto/rand.Read always returns len(b), nil on supported platforms
	return hex.EncodeToString(b)
}

// YouTube URL validation patterns.
var ytPatterns = []*regexp.Regexp{
	regexp.MustCompile(`youtube\.com/watch\?v=[\w-]{11}`),
	regexp.MustCompile(`youtu\.be/[\w-]{11}`),
	regexp.MustCompile(`youtube\.com/shorts/[\w-]{11}`),
	regexp.MustCompile(`youtube\.com/embed/[\w-]{11}`),
	regexp.MustCompile(`music\.youtube\.com/watch\?v=[\w-]{11}`),
}

// isValidYouTubeURL checks if a URL is a valid YouTube video URL.
func isValidYouTubeURL(url string) bool {
	for _, p := range ytPatterns {
		if p.MatchString(url) {
			return true
		}
	}
	return false
}

// ============================================================================
// Converter Methods
// ============================================================================

// GetConversionPresets returns all available conversion presets.
func (a *App) GetConversionPresets() []core.ConversionPreset {
	return core.GetDefaultPresets()
}

// GetConversionPresetsByCategory returns presets filtered by category.
func (a *App) GetConversionPresetsByCategory(category string) []core.ConversionPreset {
	if a.converterService == nil {
		return []core.ConversionPreset{}
	}
	return a.converterService.GetPresetsByCategory(category)
}

// AnalyzeMediaFile analyzes a media file and returns its information.
func (a *App) AnalyzeMediaFile(filePath string) (*core.MediaInfo, error) {
	if a.converterService == nil {
		return nil, core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}
	return a.converterService.AnalyzeFile(a.ctx, filePath)
}

// StartConversion starts a new conversion job.
func (a *App) StartConversion(inputPath, outputPath, presetID string) (*core.ConversionJob, error) {
	if a.converterService == nil {
		return nil, core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}
	return a.converterService.StartConversion(genID(), inputPath, outputPath, presetID, nil)
}

// StartCustomConversion starts a conversion with custom FFmpeg arguments.
func (a *App) StartCustomConversion(inputPath, outputPath string, args []string) (*core.ConversionJob, error) {
	if a.converterService == nil {
		return nil, core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}
	return a.converterService.StartConversion(genID(), inputPath, outputPath, "", args)
}

// CancelConversion cancels a running conversion.
func (a *App) CancelConversion(id string) error {
	if a.converterService == nil {
		return core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}
	return a.converterService.CancelConversion(id)
}

// GetConversionJobs returns all conversion jobs.
func (a *App) GetConversionJobs() []*core.ConversionJob {
	if a.converterService == nil {
		return []*core.ConversionJob{}
	}
	return a.converterService.GetAllJobs()
}

// RemoveConversionJob removes a completed/failed/cancelled job.
func (a *App) RemoveConversionJob(id string) error {
	if a.converterService == nil {
		return core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}
	return a.converterService.RemoveJob(id)
}

// ClearCompletedConversions removes all completed conversion jobs.
func (a *App) ClearCompletedConversions() {
	if a.converterService != nil {
		a.converterService.ClearCompletedJobs()
	}
}

// SelectFile opens a native file picker dialog.
func (a *App) SelectFile(title string, filters []runtime.FileFilter) (string, error) {
	return runtime.OpenFileDialog(a.ctx, runtime.OpenDialogOptions{
		Title:   title,
		Filters: filters,
	})
}

// SelectMediaFile opens a file picker for media files.
func (a *App) SelectMediaFile() (string, error) {
	return a.SelectFile("Select Media File", []runtime.FileFilter{
		{
			DisplayName: "Media Files",
			Pattern:     "*.mp4;*.mkv;*.avi;*.mov;*.webm;*.mp3;*.m4a;*.wav;*.flac;*.ogg;*.aac",
		},
		{
			DisplayName: "Video Files",
			Pattern:     "*.mp4;*.mkv;*.avi;*.mov;*.webm;*.wmv;*.flv",
		},
		{
			DisplayName: "Audio Files",
			Pattern:     "*.mp3;*.m4a;*.wav;*.flac;*.ogg;*.aac;*.wma",
		},
		{
			DisplayName: "All Files",
			Pattern:     "*.*",
		},
	})
}

// ============================================================================
// YouTube Search Methods
// ============================================================================

// YouTubeSearchResult represents a single search result.
type YouTubeSearchResult struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Author      string `json:"author"`
	Duration    string `json:"duration"`
	DurationSec int    `json:"durationSec"`
	Thumbnail   string `json:"thumbnail"`
	ViewCount   string `json:"viewCount"`
	PublishedAt string `json:"publishedAt"`
	URL         string `json:"url"`
}

// YouTubeSearchResponse contains the search results.
type YouTubeSearchResponse struct {
	Results []YouTubeSearchResult `json:"results"`
	Query   string                `json:"query"`
}

// SearchYouTube searches YouTube and returns results.
func (a *App) SearchYouTube(query string, limit int) (*YouTubeSearchResponse, error) {
	if a.youtubeSearcher == nil {
		return nil, core.NewAppError(core.ErrCodeGeneric, "YouTube searcher not initialized", nil)
	}

	if limit <= 0 {
		limit = 20
	}

	response, err := a.youtubeSearcher.Search(a.ctx, query, limit)
	if err != nil {
		return nil, err
	}

	// Convert to our response type
	results := make([]YouTubeSearchResult, len(response.Results))
	for i, r := range response.Results {
		results[i] = YouTubeSearchResult{
			ID:          r.ID,
			Title:       r.Title,
			Author:      r.Author,
			Duration:    r.Duration,
			DurationSec: r.DurationSec,
			Thumbnail:   r.Thumbnail,
			ViewCount:   r.ViewCount,
			PublishedAt: r.PublishedAt,
			URL:         r.URL,
		}
	}

	return &YouTubeSearchResponse{
		Results: results,
		Query:   response.Query,
	}, nil
}

// GetTrendingVideos fetches trending videos.
func (a *App) GetTrendingVideos(country string, limit int) (*YouTubeSearchResponse, error) {
	if a.youtubeSearcher == nil {
		return nil, core.NewAppError(core.ErrCodeGeneric, "YouTube searcher not initialized", nil)
	}

	if limit <= 0 {
		limit = 20
	}

	response, err := a.youtubeSearcher.GetTrending(a.ctx, country, limit)
	if err != nil {
		return nil, err
	}

	// Convert to our response type
	results := make([]YouTubeSearchResult, len(response.Results))
	for i, r := range response.Results {
		results[i] = YouTubeSearchResult{
			ID:          r.ID,
			Title:       r.Title,
			Author:      r.Author,
			Duration:    r.Duration,
			DurationSec: r.DurationSec,
			Thumbnail:   r.Thumbnail,
			ViewCount:   r.ViewCount,
			PublishedAt: r.PublishedAt,
			URL:         r.URL,
		}
	}

	return &YouTubeSearchResponse{
		Results: results,
		Query:   "trending",
	}, nil
}

// ============================================================================
// App Update Methods
// ============================================================================

// GetAppVersion returns the current application version.
func (a *App) GetAppVersion() string {
	return a.version
}

// CheckForUpdate checks if a new version is available.
func (a *App) CheckForUpdate() (*updater.UpdateInfo, error) {
	if a.updater == nil {
		return nil, core.NewAppError(core.ErrCodeGeneric, "Updater not initialized", nil)
	}

	// Set up progress callback to emit events
	a.updater.SetProgressCallback(func(info updater.UpdateInfo) {
		a.emit("update:progress", info)
	})

	return a.updater.CheckForUpdate(a.ctx)
}

// DownloadUpdate downloads the available update.
func (a *App) DownloadUpdate() (string, error) {
	if a.updater == nil {
		return "", core.NewAppError(core.ErrCodeGeneric, "Updater not initialized", nil)
	}
	return a.updater.DownloadUpdate(a.ctx)
}

// InstallUpdate installs the downloaded update and restarts the app.
func (a *App) InstallUpdate() error {
	if a.updater == nil {
		return core.NewAppError(core.ErrCodeGeneric, "Updater not initialized", nil)
	}

	err := a.updater.InstallUpdate()
	if err != nil {
		return err
	}

	// Quit the app to allow the update to proceed
	runtime.Quit(a.ctx)
	return nil
}

// GetUpdateInfo returns the current update status.
func (a *App) GetUpdateInfo() updater.UpdateInfo {
	if a.updater == nil {
		return updater.UpdateInfo{Status: updater.StatusIdle}
	}
	return a.updater.GetUpdateInfo()
}

// OpenReleasePage opens the GitHub release page in the browser.
func (a *App) OpenReleasePage() error {
	if a.updater == nil {
		return core.NewAppError(core.ErrCodeGeneric, "Updater not initialized", nil)
	}
	return a.updater.OpenReleasePage()
}
