export type DownloadState =
  | "queued"
  | "fetching_metadata"
  | "ready"
  | "downloading"
  | "converting"
  | "completed"
  | "failed"
  | "cancel_requested"
  | "cancelled";

export type Format = "mp3" | "m4a" | "mp4";
export type AudioQuality = "128" | "192" | "256" | "320";
export type VideoQuality = "360p" | "480p" | "720p" | "1080p" | "best";
export type ThemeMode = "light" | "dark" | "system";
export type TabId = "downloads" | "converter" | "browse" | "settings" | "about";

// Interfaces
export interface VideoMetadata {
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  description?: string;
}

export interface QueueItem {
  id: string;
  url: string;
  state: DownloadState;
  format: Format;
  metadata?: VideoMetadata;
  savePath: string;
  filePath?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DownloadProgress {
  itemId: string;
  state: DownloadState;
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number;
  eta: number;
  error?: string;
}

export interface QueueItemWithProgress extends QueueItem {
  progress?: DownloadProgress;
}

export interface Settings {
  version: number;
  defaultSavePath: string;
  defaultFormat: string;
  defaultAudioQuality: string;
  defaultVideoQuality: string;
  maxConcurrentDownloads: number;
  ffmpegPath?: string;
  ffprobePath?: string;
  language?: string;
  themeMode?: string;
  accentColor?: string;
  logLevel?: string;
}

export interface FFmpegStatus {
  available: boolean;
  path: string;
  version: string;
  bundled: boolean;
  ffprobeAvailable: boolean;
  ffprobePath: string;
}

export interface ImportResult {
  added: number;
  skipped: number;
  invalid: number;
  errors?: string[];
}

export interface YouTubeSearchResult {
  id: string;
  title: string;
  author: string;
  duration: string;
  durationSec: number;
  thumbnail: string;
  viewCount: string;
  publishedAt: string;
  url: string;
}

export interface YouTubeSearchResponse {
  results: YouTubeSearchResult[];
  query: string;
}

export interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  releaseUrl: string;
  downloadUrl: string;
  downloadSize: number;
  status: string;
  progress: number;
  error?: string;
}

// Helpers
export function isTerminalState(s: DownloadState): boolean {
  return s === "completed" || s === "failed" || s === "cancelled";
}

export function isActiveState(s: DownloadState): boolean {
  return (
    s === "fetching_metadata" ||
    s === "downloading" ||
    s === "converting" ||
    s === "cancel_requested"
  );
}

export function isAudioFormat(f: Format): boolean {
  return f === "mp3" || f === "m4a";
}
