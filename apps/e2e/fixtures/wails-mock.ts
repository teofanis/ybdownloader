/**
 * In-browser Wails mock for Playwright.
 *
 * Keeps a small amount of state (queue, settings) and fires `queue:updated`
 * like the real app expects. Swap the boot path later for real Wails without
 * rewriting page objects — see apps/e2e/README.md § Mocked vs real.
 */
export const WAILS_MOCK_SCRIPT = `
(() => {
  const __init = window.__E2E_WAILS_INIT__ || {};
  delete window.__E2E_WAILS_INIT__;

  const defaultSettings = {
    version: 1,
    defaultSavePath: "/tmp",
    defaultFormat: "mp3",
    defaultAudioQuality: "192",
    defaultVideoQuality: "720p",
    maxConcurrentDownloads: 2,
    downloadBackend: "yt-dlp",
    themeMode: "system",
    language: "en",
  };

  const searchResults = Array.isArray(__init.searchResults)
    ? __init.searchResults
    : [];
  const trendingResults = Array.isArray(__init.trendingResults)
    ? __init.trendingResults
    : searchResults;
  const conversionPresets = Array.isArray(__init.conversionPresets)
    ? __init.conversionPresets
    : [];
  const mediaFile = __init.mediaFile || "/tmp/e2e-sample.mp4";
  const mediaInfo = __init.mediaInfo || {
    duration: 120,
    format: "mp4",
    size: 10000000,
    bitrate: 1000000,
    videoStream: {
      codec: "h264",
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 800000,
    },
    audioStream: {
      codec: "aac",
      channels: 2,
      sampleRate: 48000,
      bitrate: 128000,
    },
  };

  const state = {
    queue: Array.isArray(__init.queue) ? [...__init.queue] : [],
    settings: { ...defaultSettings, ...(__init.settings || {}) },
    conversionJobs: Array.isArray(__init.conversionJobs)
      ? [...__init.conversionJobs]
      : [],
    listeners: new Map(),
    nextId: 1,
  };

  function listenersFor(event) {
    if (!state.listeners.has(event)) {
      state.listeners.set(event, new Set());
    }
    return state.listeners.get(event);
  }

  function emit(event, data) {
    const subs = state.listeners.get(event);
    if (!subs) return;
    for (const cb of subs) {
      try {
        cb(data);
      } catch (err) {
        console.error("[e2e wails mock] listener error", event, err);
      }
    }
  }

  function notifyQueue() {
    emit("queue:updated", [...state.queue]);
  }

  function makeConversionJob(inputPath, outputPath, presetId) {
    const job = {
      id: "e2e-conv-" + state.nextId++,
      inputPath: String(inputPath),
      outputPath: String(outputPath || "/tmp/e2e-output"),
      presetId: String(presetId),
      state: "queued",
      progress: 0,
      inputInfo: mediaInfo,
    };
    state.conversionJobs.unshift(job);
    return job;
  }

  function makeQueueItem(url, format) {
    const now = new Date().toISOString();
    return {
      id: "e2e-item-" + state.nextId++,
      url: String(url),
      state: "queued",
      format: String(format),
      savePath: state.settings.defaultSavePath || "/tmp",
      createdAt: now,
      updatedAt: now,
      metadata: {
        id: "e2e-meta",
        title: "E2E Added Video",
        author: "Test Channel",
        duration: 180,
        thumbnail: "",
      },
    };
  }

  const knownMocks = {
    GetSettings: () => Promise.resolve({ ...state.settings }),
    GetQueue: () => Promise.resolve([...state.queue]),
    GetAppVersion: () => Promise.resolve(__init.appVersion || "0.0.0-e2e"),
    GetFFmpegStatus: () =>
      Promise.resolve({
        available: false,
        path: "",
        version: "",
        bundled: false,
        ffprobeAvailable: false,
        ffprobePath: "",
      }),
    GetYtDlpStatus: () =>
      Promise.resolve({
        available: false,
        path: "",
        version: "",
        bundled: false,
        hasJSRuntime: false,
      }),
    GetYtDlpDefaultFlags: () => Promise.resolve({ mp3: [], m4a: [], mp4: [] }),
    GetTrendingVideos: () =>
      Promise.resolve({
        results: trendingResults,
        query: "",
      }),
    GetConversionJobs: () => Promise.resolve([...state.conversionJobs]),
    GetConversionPresets: () => Promise.resolve([...conversionPresets]),
    GetConversionPresetsByCategory: (category) =>
      Promise.resolve(
        conversionPresets.filter((preset) => preset.category === category),
      ),
    SelectMediaFile: () => Promise.resolve(mediaFile),
    AnalyzeMediaFile: () => Promise.resolve(mediaInfo),
    OpenFile: () => Promise.resolve(""),
    SelectDirectory: () => Promise.resolve(state.settings.defaultSavePath || "/tmp"),
    StartConversion: (inputPath, outputPath, presetId) =>
      Promise.resolve(makeConversionJob(inputPath, outputPath, presetId)),
    StartConversionWithTrim: (inputPath, outputPath, presetId) =>
      Promise.resolve(makeConversionJob(inputPath, outputPath, presetId)),
    CancelConversion: (jobId) => {
      state.conversionJobs = state.conversionJobs.map((job) =>
        job.id === jobId ? { ...job, state: "cancelled" } : job,
      );
      return Promise.resolve();
    },
    RemoveConversionJob: (jobId) => {
      state.conversionJobs = state.conversionJobs.filter(
        (job) => job.id !== jobId,
      );
      return Promise.resolve();
    },
    ClearCompletedConversions: () => {
      state.conversionJobs = state.conversionJobs.filter(
        (job) => job.state !== "completed",
      );
      return Promise.resolve();
    },
    GenerateWaveform: () => Promise.resolve([]),
    GetUpdateInfo: () =>
      Promise.resolve({
        status: "idle",
        currentVersion: "0.0.0-e2e",
        latestVersion: "0.0.0-e2e",
        releaseNotes: "",
        releaseUrl: "",
        downloadUrl: "",
        downloadSize: 0,
        progress: 0,
      }),
    CheckForUpdate: () =>
      Promise.resolve({
        status: "idle",
        currentVersion: "0.0.0-e2e",
        latestVersion: "0.0.0-e2e",
        releaseNotes: "",
        releaseUrl: "",
        downloadUrl: "",
        downloadSize: 0,
        progress: 0,
      }),
    GetDownloadBackend: () => Promise.resolve(state.settings.downloadBackend || "yt-dlp"),
    IsValidYouTubeURL: (url) =>
      Promise.resolve(/youtube|youtu\\.be/.test(String(url))),
    ImportURLs: () => Promise.resolve({ added: 0, skipped: 0, invalid: 0 }),
    SearchYouTube: (query) =>
      Promise.resolve({
        results: searchResults,
        query: String(query || ""),
      }),
    AddToQueue: (url, format) => {
      const item = makeQueueItem(url, format);
      state.queue.push(item);
      notifyQueue();
      return Promise.resolve(item);
    },
    RemoveFromQueue: (id) => {
      state.queue = state.queue.filter((item) => item.id !== id);
      notifyQueue();
      return Promise.resolve();
    },
    StartDownload: () => Promise.resolve(),
    StartAllDownloads: () => Promise.resolve(),
    CancelDownload: () => Promise.resolve(),
    CancelAllDownloads: () => Promise.resolve(),
    RetryDownload: () => Promise.resolve(),
    ClearCompleted: () => {
      state.queue = state.queue.filter((item) => item.state !== "completed");
      notifyQueue();
      return Promise.resolve();
    },
    SaveSettings: (settings) => {
      state.settings = { ...state.settings, ...settings };
      return Promise.resolve();
    },
    ResetSettings: () => {
      state.settings = { ...defaultSettings };
      return Promise.resolve({ ...state.settings });
    },
  };

  const app = new Proxy(knownMocks, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return () => Promise.resolve(null);
    },
  });

  window.go = window.go || {};
  window.go.app = window.go.app || {};
  window.go.app.App = app;

  const runtime = {
    EventsOn: (event, cb) => {
      listenersFor(event).add(cb);
      return () => listenersFor(event).delete(cb);
    },
    EventsOnMultiple: (event, cb) => runtime.EventsOn(event, cb),
    EventsOff: () => {},
    EventsEmit: (event, data) => emit(event, data),
    WindowSetTitle: () => {},
    BrowserOpenURL: () => {},
    Quit: () => {},
    LogPrint: () => {},
    LogTrace: () => {},
    LogDebug: () => {},
    LogInfo: () => {},
    LogWarning: () => {},
    LogError: () => {},
    LogFatal: () => {},
  };

  window.runtime = new Proxy(runtime, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return () => undefined;
    },
  });

  window.__E2E_WAILS__ = {
    emit,
    getQueue: () => [...state.queue],
    getSettings: () => ({ ...state.settings }),
  };
})();
`;
