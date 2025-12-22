import * as App from "../../wailsjs/go/app/App";
import type {
  Format,
  DownloadProgress,
  QueueItem,
  Settings,
  VideoMetadata,
  FFmpegStatus,
  ImportResult,
  YouTubeSearchResult,
  YouTubeSearchResponse,
  UpdateInfo,
} from "@/types";
import type {
  ConversionPreset,
  ConversionJob,
  MediaInfo,
  ConversionProgress,
} from "@/features/converter/types";

export type {
  QueueItem,
  Settings,
  VideoMetadata,
  FFmpegStatus,
  ImportResult,
  YouTubeSearchResult,
  YouTubeSearchResponse,
  UpdateInfo,
  ConversionPreset,
  ConversionJob,
  MediaInfo,
  ConversionProgress,
};

// Queue
export const addToQueue = (url: string, format: Format) =>
  App.AddToQueue(url, format) as Promise<QueueItem>;
export const importURLs = (urls: string[], format: Format) =>
  App.ImportURLs(urls, format) as Promise<ImportResult>;
export const removeFromQueue = App.RemoveFromQueue;
export const getQueue = () => App.GetQueue() as Promise<QueueItem[]>;
export const startDownload = App.StartDownload;
export const startAllDownloads = App.StartAllDownloads;
export const cancelDownload = App.CancelDownload;
export const cancelAllDownloads = App.CancelAllDownloads;
export const retryDownload = App.RetryDownload;
export const clearCompleted = App.ClearCompleted;
export const fetchMetadata = (url: string) =>
  App.FetchMetadata(url) as Promise<VideoMetadata>;
export const isValidYouTubeURL = App.IsValidYouTubeURL;

// Settings
export const getSettings = () => App.GetSettings() as Promise<Settings>;
export const saveSettings = (s: Settings) =>
  App.SaveSettings(s as Parameters<typeof App.SaveSettings>[0]);
export const resetSettings = () => App.ResetSettings() as Promise<Settings>;
export const selectDirectory = App.SelectDirectory;

// Files
export const openFile = App.OpenFile;
export const openFolder = App.OpenFolder;

// FFmpeg
export const checkFFmpeg = App.CheckFFmpeg;
export const getFFmpegStatus = () =>
  App.GetFFmpegStatus() as Promise<FFmpegStatus>;
export const downloadFFmpeg = App.DownloadFFmpeg;

// Converter
export const getConversionPresets = () =>
  App.GetConversionPresets() as Promise<ConversionPreset[]>;
export const getConversionPresetsByCategory = (cat: string) =>
  App.GetConversionPresetsByCategory(cat) as Promise<ConversionPreset[]>;
export const analyzeMediaFile = (path: string) =>
  App.AnalyzeMediaFile(path) as Promise<MediaInfo>;
export const startConversion = (
  input: string,
  output: string,
  preset: string
) => App.StartConversion(input, output, preset) as Promise<ConversionJob>;
export const startConversionWithTrim = (
  input: string,
  output: string,
  preset: string,
  start: number,
  end: number
) =>
  App.StartConversionWithTrim(
    input,
    output,
    preset,
    start,
    end
  ) as Promise<ConversionJob>;
export const startCustomConversion = (
  input: string,
  output: string,
  args: string[]
) => App.StartCustomConversion(input, output, args) as Promise<ConversionJob>;
export const generateWaveform = App.GenerateWaveform;
export const cancelConversion = App.CancelConversion;
export const getConversionJobs = () =>
  App.GetConversionJobs() as Promise<ConversionJob[]>;
export const removeConversionJob = App.RemoveConversionJob;
export const clearCompletedConversions = App.ClearCompletedConversions;
export const selectMediaFile = App.SelectMediaFile;

// YouTube
export const searchYouTube = (query: string, limit: number) =>
  App.SearchYouTube(query, limit) as Promise<YouTubeSearchResponse>;
export const getTrendingVideos = (country: string, limit: number) =>
  App.GetTrendingVideos(country, limit) as Promise<YouTubeSearchResponse>;

// Updates
export type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error"
  | "up_to_date";

export const getAppVersion = App.GetAppVersion;
export const checkForUpdate = () => App.CheckForUpdate() as Promise<UpdateInfo>;
export const downloadUpdate = App.DownloadUpdate;
export const installUpdate = App.InstallUpdate;
export const getUpdateInfo = () => App.GetUpdateInfo() as Promise<UpdateInfo>;
export const openReleasePage = App.OpenReleasePage;

// Events
export const Events = {
  DOWNLOAD_PROGRESS: "download:progress",
  DOWNLOAD_COMPLETE: "download:complete",
  DOWNLOAD_ERROR: "download:error",
  QUEUE_UPDATED: "queue:updated",
  FFMPEG_PROGRESS: "ffmpeg:progress",
  CONVERSION_PROGRESS: "conversion:progress",
  UPDATE_PROGRESS: "update:progress",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

export interface EventPayloads {
  [Events.DOWNLOAD_PROGRESS]: DownloadProgress;
  [Events.DOWNLOAD_COMPLETE]: { itemId: string; filePath: string };
  [Events.DOWNLOAD_ERROR]: { itemId: string; error: string };
  [Events.QUEUE_UPDATED]: QueueItem[];
  [Events.FFMPEG_PROGRESS]: { percent: number; status: string };
  [Events.CONVERSION_PROGRESS]: ConversionProgress;
  [Events.UPDATE_PROGRESS]: UpdateInfo;
}
