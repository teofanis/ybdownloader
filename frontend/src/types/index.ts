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

export interface VideoMetadata {
  id: string;
  title: string;
  author: string;
  duration: number;
  thumbnail: string;
  description?: string;
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

export interface Settings {
  version: number;
  defaultSavePath: string;
  defaultFormat: Format;
  defaultAudioQuality: AudioQuality;
  defaultVideoQuality: VideoQuality;
  maxConcurrentDownloads: number;
  ffmpegPath?: string;
}

export interface QueueItemWithProgress extends QueueItem {
  progress?: DownloadProgress;
}

export type TabId = "downloads" | "settings" | "browse";

export function isTerminalState(s: DownloadState) {
  return s === "completed" || s === "failed" || s === "cancelled";
}

export function isActiveState(s: DownloadState) {
  return s === "fetching_metadata" || s === "downloading" || s === "converting";
}

export function isAudioFormat(f: Format) {
  return f === "mp3" || f === "m4a";
}

const stateLabels: Record<DownloadState, string> = {
  queued: "Queued",
  fetching_metadata: "Fetching info...",
  ready: "Ready",
  downloading: "Downloading",
  converting: "Converting",
  completed: "Completed",
  failed: "Failed",
  cancel_requested: "Cancelling...",
  cancelled: "Cancelled",
};

export function getStateLabel(s: DownloadState) {
  return stateLabels[s];
}

const formatLabels: Record<Format, string> = {
  mp3: "MP3 (Audio)",
  m4a: "M4A (Audio)",
  mp4: "MP4 (Video)",
};

export function getFormatLabel(f: Format) {
  return formatLabels[f];
}
