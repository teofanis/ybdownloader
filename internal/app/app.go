package app

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log/slog"
	"net/url"
	"path/filepath"
	"regexp"
	goruntime "runtime"
	"strings"
	"time"

	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"

	"ybdownloader/internal/core"
	"ybdownloader/internal/infra/converter"
	"ybdownloader/internal/infra/downloader"
	"ybdownloader/internal/infra/fs"
	"ybdownloader/internal/infra/logging"
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
	pendingDeepLink  string // Deep link to process after startup (Windows/Linux first launch)
}

func New(version string) (*App, error) {
	filesystem := fs.New()
	store, err := settings.NewStore(filesystem)
	if err != nil {
		return nil, err
	}

	// Initialize logging
	if err := initLogging(filesystem, store); err != nil {
		// Log to stderr if logging init fails
		slog.Error("failed to initialize logging", "error", err)
	}

	slog.Info("application starting",
		"version", version,
		"platform", getPlatform(),
	)

	getSettings := func() (*core.Settings, error) {
		return store.Load()
	}

	dl, err := downloader.New(filesystem, getSettings)
	if err != nil {
		slog.Warn("downloader initialization failed, some features may be unavailable", "error", err)
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

func initLogging(filesystem core.FileSystem, store core.SettingsStore) error {
	configDir, err := filesystem.GetConfigDir()
	if err != nil {
		return err
	}

	logDir := filepath.Join(configDir, "logs")

	settings, _ := store.Load()
	level := logging.LevelInfo
	if settings != nil && settings.LogLevel != "" {
		level = logging.ParseLevel(settings.LogLevel)
	}

	return logging.Init(logging.Config{
		Level:      level,
		LogDir:     logDir,
		MaxAgeDays: 7,
		Console:    false,
		JSONFormat: false,
	})
}

func getPlatform() string {
	return goruntime.GOOS + "/" + goruntime.GOARCH
}

// SetPendingDeepLink stores a deep link URL to be processed after startup.
// Used for Windows/Linux first launch via deep link where the URL is passed as a command line arg.
func (a *App) SetPendingDeepLink(url string) {
	a.pendingDeepLink = url
	slog.Info("pending deep link set", "url", url)
}

// OnUrlOpen handles deep links on macOS.
// Called when the app is launched via a deep link OR when a deep link is clicked while the app is running.
func (a *App) OnUrlOpen(url string) {
	slog.Info("macOS OnUrlOpen called", "url", url)

	// If context is not set yet (app starting up), store as pending
	if a.ctx == nil {
		a.pendingDeepLink = url
		slog.Debug("context not ready, storing as pending deep link")
		return
	}

	// Process the deep link
	if strings.HasPrefix(url, "ybdownloader://") {
		a.handleDeepLink(url)
		runtime.WindowUnminimise(a.ctx)
		runtime.Show(a.ctx)
	}
}

// Startup is called by Wails when the app launches.
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
	slog.Info("application startup initiated")

	// Initialize queue manager with emit function
	if a.downloader != nil {
		a.queueManager = queue.New(a.downloader, a.settingsStore.Load, a.emit)
		slog.Debug("queue manager initialized")
	} else {
		slog.Warn("queue manager not initialized - downloader unavailable")
	}

	// Initialize converter service
	ffmpegManager := downloader.NewFFmpegManager(a.fs, a.settingsStore.Load, a.settingsStore.Save)
	if ffmpegPath, err := ffmpegManager.GetFFmpegPath(); err == nil {
		a.converterService = converter.New(ffmpegPath, a.emit)
		slog.Info("converter service initialized", "ffmpegPath", ffmpegPath)
	} else {
		slog.Warn("converter service not initialized - FFmpeg not found", "error", err)
	}

	// Initialize YouTube searcher
	a.youtubeSearcher = ytsearch.NewSearcher()
	slog.Debug("youtube searcher initialized")

	// Process any pending deep link from first launch (Windows/Linux or early macOS)
	if a.pendingDeepLink != "" {
		slog.Info("processing pending deep link", "url", a.pendingDeepLink)
		a.handleDeepLink(a.pendingDeepLink)
		a.pendingDeepLink = ""
	}
}

// Shutdown stops active downloads gracefully.
func (a *App) Shutdown(_ context.Context) {
	slog.Info("application shutting down")

	if a.queueManager != nil {
		a.queueManager.Shutdown()
		slog.Debug("queue manager shutdown complete")
	}

	// Close logger to flush any buffered logs
	if err := logging.Close(); err != nil {
		slog.Error("failed to close logger", "error", err)
	}
}

// OnSecondInstance handles second instance launches and deep links.
// Deep link format: ybdownloader://add?url=YOUTUBE_URL&format=mp3
func (a *App) OnSecondInstance(data options.SecondInstanceData) {
	slog.Info("second instance launched", "args", data.Args)
	runtime.WindowUnminimise(a.ctx)
	runtime.Show(a.ctx)

	// Check for deep link in args
	for _, arg := range data.Args {
		if strings.HasPrefix(arg, "ybdownloader://") {
			a.handleDeepLink(arg)
			break
		}
	}
}

// handleDeepLink processes deep link URLs.
// Uses app settings as defaults; query parameters override if provided.
// Supported params: url (required), format (mp3|mp4|webm)
func (a *App) handleDeepLink(link string) {
	parsed, err := url.Parse(link)
	if err != nil {
		slog.Error("failed to parse deep link", "link", link, "error", err)
		return
	}

	switch parsed.Host {
	case "add":
		a.handleDeepLinkAdd(parsed.Query())
	default:
		slog.Warn("unknown deep link action", "action", parsed.Host, "link", link)
	}
}

// handleDeepLinkAdd adds a video to the download queue.
// Query params override settings: format.
func (a *App) handleDeepLinkAdd(query url.Values) {
	videoURL := query.Get("url")
	if videoURL == "" {
		slog.Warn("deep link: missing url parameter")
		runtime.EventsEmit(a.ctx, "deeplink:error", "Missing URL parameter")
		return
	}

	// Load settings for defaults
	settings, err := a.settingsStore.Load()
	if err != nil {
		slog.Error("deep link: failed to load settings", "error", err)
	}

	// Use settings as defaults, allow query param overrides
	format := "mp3" // fallback default
	if settings != nil {
		format = string(settings.DefaultFormat)
	}

	if f := query.Get("format"); f != "" {
		// Validate format is allowed
		switch f {
		case "mp3", "mp4", "webm":
			format = f
		default:
			slog.Warn("deep link: invalid format, using default", "provided", f, "default", format)
		}
	}

	slog.Info("deep link: adding to queue",
		"url", videoURL,
		"format", format,
		"fromSettings", query.Get("format") == "",
	)

	// Add to queue
	item, err := a.AddToQueue(videoURL, format)
	if err != nil {
		slog.Error("deep link: failed to add to queue", "error", err)
		runtime.EventsEmit(a.ctx, "deeplink:error", err.Error())
		return
	}

	// Notify frontend and switch to downloads tab
	runtime.EventsEmit(a.ctx, "deeplink:added", item)
	runtime.EventsEmit(a.ctx, "navigate", "downloads")
}

func (a *App) GetSettings() (*core.Settings, error) {
	return a.settingsStore.Load()
}

func (a *App) SaveSettings(s *core.Settings) error {
	// Get old settings to detect changes
	old, _ := a.settingsStore.Load()

	if err := a.settingsStore.Save(s); err != nil {
		slog.Error("failed to save settings", "error", err)
		return err
	}

	// Update log level if changed
	if old == nil || old.LogLevel != s.LogLevel {
		logging.SetGlobalLevel(logging.ParseLevel(s.LogLevel))
		slog.Info("log level changed", "level", s.LogLevel)
	}

	slog.Debug("settings saved")
	return nil
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

	err := manager.DownloadFFmpeg(a.ctx, func(percent float64, status string) {
		a.emit("ffmpeg:progress", map[string]interface{}{
			"percent": percent,
			"status":  status,
		})
	})
	if err != nil {
		return err
	}

	// Reinitialize converter service now that FFmpeg is available
	a.reinitializeConverter()

	return nil
}

// reinitializeConverter attempts to initialize/reinitialize the converter service.
// Called after FFmpeg is downloaded or settings change.
func (a *App) reinitializeConverter() {
	manager := downloader.NewFFmpegManager(a.fs, a.settingsStore.Load, a.settingsStore.Save)
	if ffmpegPath, err := manager.GetFFmpegPath(); err == nil {
		a.converterService = converter.New(ffmpegPath, a.emit)
	}
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
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.converterService.AnalyzeFile(ctx, filePath)
}

// StartConversion starts a new conversion job.
func (a *App) StartConversion(inputPath, outputPath, presetID string) (*core.ConversionJob, error) {
	if a.converterService == nil {
		return nil, core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}
	return a.converterService.StartConversion(genID(), inputPath, outputPath, presetID, nil)
}

// StartConversionWithTrim starts a new conversion job with trim options.
func (a *App) StartConversionWithTrim(inputPath, outputPath, presetID string, startTime, endTime float64) (*core.ConversionJob, error) {
	if a.converterService == nil {
		return nil, core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}

	var trim *core.TrimOptions
	if startTime > 0 || endTime > 0 {
		trim = &core.TrimOptions{
			StartTime: startTime,
			EndTime:   endTime,
		}
	}

	return a.converterService.StartConversionWithTrim(genID(), inputPath, outputPath, presetID, nil, trim)
}

// StartCustomConversion starts a conversion with custom FFmpeg arguments.
func (a *App) StartCustomConversion(inputPath, outputPath string, args []string) (*core.ConversionJob, error) {
	if a.converterService == nil {
		return nil, core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}
	return a.converterService.StartConversion(genID(), inputPath, outputPath, "", args)
}

// GenerateWaveform generates audio waveform data for visualization.
func (a *App) GenerateWaveform(filePath string, numSamples int) ([]float64, error) {
	if a.converterService == nil {
		return nil, core.NewAppError(core.ErrCodeFFmpegNotFound, "Converter not initialized", nil)
	}
	ctx, cancel := context.WithTimeout(a.ctx, 10*time.Second)
	defer cancel()
	return a.converterService.GenerateWaveform(ctx, filePath, numSamples)
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
