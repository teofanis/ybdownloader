/**
 * Frontend type definitions.
 * These extend/refine the Wails-generated types in wailsjs/go/models.ts
 * with proper TypeScript union types for better type safety.
 */

// Re-export Wails classes for runtime use (they have createFrom methods)
export { core } from '../../wailsjs/go/models';

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

export function isTerminalState(s: DownloadState): boolean {
  return s === "completed" || s === "failed" || s === "cancelled";
}

export function isActiveState(s: DownloadState): boolean {
  return s === "fetching_metadata" || s === "downloading" || s === "converting";
}

export function isAudioFormat(f: Format): boolean {
  return f === "mp3" || f === "m4a";
}
