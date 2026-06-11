/**
 * Wails runtime mock for Playwright E2E tests.
 * Uses a Proxy so unmocked bindings return safe defaults instead of crashing React.
 */
export const WAILS_MOCK_SCRIPT = `
(() => {
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

  const knownMocks = {
    GetSettings: () => Promise.resolve(defaultSettings),
    GetQueue: () => Promise.resolve([]),
    GetAppVersion: () => Promise.resolve("0.0.0-e2e"),
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
    GetTrendingVideos: () => Promise.resolve({ results: [], query: "" }),
    GetConversionJobs: () => Promise.resolve([]),
    GetConversionPresets: () => Promise.resolve([]),
    GetConversionPresetsByCategory: () => Promise.resolve([]),
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
    GetDownloadBackend: () => Promise.resolve("yt-dlp"),
    IsValidYouTubeURL: (url) => Promise.resolve(/youtube|youtu\\.be/.test(String(url))),
    ImportURLs: () => Promise.resolve({ added: 0, skipped: 0, invalid: 0 }),
    SearchYouTube: () => Promise.resolve({ results: [], query: "" }),
    AddToQueue: () =>
      Promise.resolve({
        id: "e2e-item",
        url: "",
        state: "queued",
        format: "mp3",
        savePath: "/tmp",
        createdAt: "",
        updatedAt: "",
      }),
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
    EventsOn: () => () => {},
    EventsOnMultiple: () => () => {},
    EventsOff: () => {},
    EventsEmit: () => {},
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
})();
`;
