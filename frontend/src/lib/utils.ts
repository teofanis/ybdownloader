import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with proper conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format bytes to human readable string.
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Format duration in seconds to mm:ss or hh:mm:ss.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format ETA in seconds to human readable string.
 */
export function formatETA(seconds: number): string {
  if (seconds < 0 || !Number.isFinite(seconds)) return "calculating...";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
}

/**
 * Validate YouTube URL.
 */
export function isValidYouTubeURL(url: string): boolean {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]{11}/,
    /^(https?:\/\/)?(music\.)?youtube\.com\/watch\?v=[\w-]{11}/,
  ];

  return patterns.some((pattern) => pattern.test(url));
}

/**
 * Extract video ID from YouTube URL.
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /music\.youtube\.com\/watch\?v=([\w-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

