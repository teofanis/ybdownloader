import type { QueueItem, DownloadProgress, Settings, VideoMetadata, Format } from "@/types";

type Binding = (...args: unknown[]) => Promise<unknown>;
type Bindings = Record<string, Binding>;

let bindings: Bindings = {};

/**
 * Initialize Wails bindings.
 * Must be called before using any API functions.
 */
export async function initializeBindings(): Promise<void> {
  try {
    const mod = await import("../../wailsjs/go/app/App");
    bindings = Object.fromEntries(
      Object.entries(mod).filter(([key]) => key !== "default")
    ) as Bindings;
  } catch (e) {
    console.warn("Wails bindings unavailable:", e);
  }
}

function call<T>(name: string, ...args: unknown[]): Promise<T> {
  const fn = bindings[name];
  if (!fn) throw new Error(`Binding ${name} not found`);
  return fn(...args) as Promise<T>;
}

/** Result of bulk URL import operation. */
export interface ImportResult {
  added: number;
  skipped: number;
  invalid: number;
  errors?: string[];
}

export const addToQueue = (url: string, format: Format) => call<QueueItem>("AddToQueue", url, format);
export const importURLs = (urls: string[], format: Format) => call<ImportResult>("ImportURLs", urls, format);
export const removeFromQueue = (id: string) => call<void>("RemoveFromQueue", id);
export const getQueue = () => call<QueueItem[]>("GetQueue");
export const startDownload = (id: string) => call<void>("StartDownload", id);
export const startAllDownloads = () => call<void>("StartAllDownloads");
export const cancelDownload = (id: string) => call<void>("CancelDownload", id);
export const cancelAllDownloads = () => call<void>("CancelAllDownloads");
export const retryDownload = (id: string) => call<void>("RetryDownload", id);
export const clearCompleted = () => call<void>("ClearCompleted");
export const fetchMetadata = (url: string) => call<VideoMetadata>("FetchMetadata", url);
export const getSettings = () => call<Settings>("GetSettings");
export const saveSettings = (s: Settings) => call<void>("SaveSettings", s);
export const resetSettings = () => call<Settings>("ResetSettings");
export const selectDirectory = () => call<string | null>("SelectDirectory");
export const openFile = (path: string) => call<void>("OpenFile", path);
export const openFolder = (path: string) => call<void>("OpenFolder", path);
export const checkFFmpeg = () => call<[boolean, string]>("CheckFFmpeg");
export const isValidYouTubeURL = (url: string) => call<boolean>("IsValidYouTubeURL", url);

/** FFmpeg status information. */
export interface FFmpegStatus {
  available: boolean;
  path: string;
  version: string;
  bundled: boolean;
}

export const getFFmpegStatus = () => call<FFmpegStatus>("GetFFmpegStatus");
export const downloadFFmpeg = () => call<void>("DownloadFFmpeg");

/** Event names for Wails event subscriptions. */
export const Events = {
  DOWNLOAD_PROGRESS: "download:progress",
  DOWNLOAD_COMPLETE: "download:complete",
  DOWNLOAD_ERROR: "download:error",
  QUEUE_UPDATED: "queue:updated",
  FFMPEG_PROGRESS: "ffmpeg:progress",
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

export interface EventPayloads {
  [Events.DOWNLOAD_PROGRESS]: DownloadProgress;
  [Events.DOWNLOAD_COMPLETE]: { itemId: string; filePath: string };
  [Events.DOWNLOAD_ERROR]: { itemId: string; error: string };
  [Events.QUEUE_UPDATED]: QueueItem[];
  [Events.FFMPEG_PROGRESS]: { percent: number; status: string };
}
