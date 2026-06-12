import {
  showcaseConversionJobs,
  showcasePresets,
  showcaseQueue,
  showcaseSettings,
} from "./fixtures";

const ffmpegStatus = {
  available: true,
  path: "/usr/bin/ffmpeg",
  version: "7.1",
  bundled: true,
  ffprobeAvailable: true,
  ffprobePath: "/usr/bin/ffprobe",
};

const ytDlpStatus = {
  available: true,
  path: "/usr/local/bin/yt-dlp",
  version: "2025.03.31",
  bundled: true,
  hasJSRuntime: true,
  jsRuntime: "node",
};

const appApi = new Proxy(
  {
    GetSettings: () => Promise.resolve(structuredClone(showcaseSettings)),
    SaveSettings: (settings: unknown) => Promise.resolve(settings),
    ResetSettings: () => Promise.resolve(structuredClone(showcaseSettings)),
    GetQueue: () => Promise.resolve(structuredClone(showcaseQueue)),
    GetConversionPresets: () =>
      Promise.resolve(structuredClone(showcasePresets)),
    GetConversionJobs: () =>
      Promise.resolve(structuredClone(showcaseConversionJobs)),
    GetFFmpegStatus: () => Promise.resolve(ffmpegStatus),
    GetYtDlpStatus: () => Promise.resolve(ytDlpStatus),
    GetYtDlpDefaultFlags: () => Promise.resolve({}),
    GetAppVersion: () => Promise.resolve("1.0.0"),
    CheckForUpdate: () =>
      Promise.resolve({
        status: "up_to_date",
        currentVersion: "1.0.0",
        latestVersion: "1.0.0",
      }),
    SelectDirectory: () => Promise.resolve(showcaseSettings.defaultSavePath),
    IsValidYouTubeURL: () => true,
    AddToQueue: () => Promise.resolve(showcaseQueue[0]),
    ImportURLs: () => Promise.resolve({ added: 0, skipped: 0, invalid: 0 }),
    RemoveFromQueue: () => Promise.resolve(),
    StartDownload: () => Promise.resolve(),
    StartAllDownloads: () => Promise.resolve(),
    CancelDownload: () => Promise.resolve(),
    CancelAllDownloads: () => Promise.resolve(),
    RetryDownload: () => Promise.resolve(),
    ClearCompleted: () => Promise.resolve(),
    FetchMetadata: () => Promise.resolve(showcaseQueue[0].metadata),
    OpenFile: () => Promise.resolve(),
    OpenFolder: () => Promise.resolve(),
    CheckFFmpeg: () => Promise.resolve(true),
    DownloadFFmpeg: () => Promise.resolve(),
    DownloadYtDlp: () => Promise.resolve(),
    GetDownloadBackend: () => Promise.resolve("yt-dlp"),
    GetTrendingVideos: () => Promise.resolve({ results: [] }),
    SearchYouTube: () => Promise.resolve({ results: [] }),
  },
  {
    get(target, prop) {
      if (prop in target) {
        return target[prop as keyof typeof target];
      }
      return () => Promise.resolve(undefined);
    },
  }
);

Object.assign(window, {
  go: { app: { App: appApi } },
  runtime: {
    EventsOnMultiple: () => () => undefined,
    EventsOn: () => () => undefined,
    EventsOff: () => undefined,
    EventsOnce: () => () => undefined,
    EventsEmit: () => undefined,
    LogPrint: () => undefined,
    LogTrace: () => undefined,
    LogDebug: () => undefined,
    LogInfo: () => undefined,
    LogWarning: () => undefined,
    LogError: () => undefined,
    WindowReload: () => undefined,
    WindowReloadApp: () => undefined,
    WindowSetTitle: () => undefined,
    BrowserOpenURL: () => undefined,
  },
});
