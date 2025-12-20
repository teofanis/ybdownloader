/**
 * Frontend type definitions matching backend domain models.
 */

// ============================================================================
// Enums (using discriminated unions for type safety)
// ============================================================================

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

// ============================================================================
// Domain Models
// ============================================================================

export interface VideoMetadata {
  id: string;
  title: string;
  author: string;
  duration: number; // seconds
  thumbnail: string;
  description?: string;
}

export interface DownloadProgress {
  itemId: string;
  state: DownloadState;
  percent: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  eta: number; // seconds remaining
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

// ============================================================================
// UI State Types
// ============================================================================

export interface QueueItemWithProgress extends QueueItem {
  progress?: DownloadProgress;
}

export type TabId = "downloads" | "settings" | "browse";

export interface AppState {
  activeTab: TabId;
  queue: QueueItemWithProgress[];
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Helper functions
// ============================================================================

export function isTerminalState(state: DownloadState): boolean {
  return state === "completed" || state === "failed" || state === "cancelled";
}

export function isActiveState(state: DownloadState): boolean {
  return (
    state === "fetching_metadata" ||
    state === "downloading" ||
    state === "converting"
  );
}

export function isAudioFormat(format: Format): boolean {
  return format === "mp3" || format === "m4a";
}

export function getStateLabel(state: DownloadState): string {
  const labels: Record<DownloadState, string> = {
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
  return labels[state];
}

export function getFormatLabel(format: Format): string {
  const labels: Record<Format, string> = {
    mp3: "MP3 (Audio)",
    m4a: "M4A (Audio)",
    mp4: "MP4 (Video)",
  };
  return labels[format];
}

