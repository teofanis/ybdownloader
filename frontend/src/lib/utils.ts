import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names, handling conflicts and conditionals.
 * @param inputs - Class names, objects, or arrays to merge
 * @returns Merged class string with Tailwind conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats bytes into a human-readable string.
 * @param bytes - Number of bytes
 * @param decimals - Decimal precision (default: 2)
 * @returns Formatted string like "1.5 MB"
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Formats seconds into a duration string.
 * @param sec - Duration in seconds
 * @returns Formatted string like "3:45" or "1:02:30"
 */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0)
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Formats seconds into an ETA string.
 * @param sec - Remaining seconds
 * @returns Formatted string like "2m 30s" or "1h 5m"
 */
export function formatETA(sec: number): string {
  if (sec < 0 || !Number.isFinite(sec)) return "...";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
  return `${Math.floor(sec / 3600)}h ${Math.round((sec % 3600) / 60)}m`;
}

const ytPatterns = [
  /youtube\.com\/watch\?v=[\w-]{11}/,
  /youtu\.be\/[\w-]{11}/,
  /youtube\.com\/shorts\/[\w-]{11}/,
  /youtube\.com\/embed\/[\w-]{11}/,
  /music\.youtube\.com\/watch\?v=[\w-]{11}/,
];

/**
 * Validates if a string is a valid YouTube URL.
 * Supports standard watch URLs, youtu.be, shorts, embed, and music URLs.
 * @param url - URL string to validate
 * @returns True if valid YouTube URL
 */
export function isValidYouTubeURL(url: string): boolean {
  return ytPatterns.some((p) => p.test(url));
}

/**
 * Extracts the 11-character video ID from a YouTube URL.
 * @param url - YouTube URL
 * @returns Video ID or null if not found
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /music\.youtube\.com\/watch\?v=([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * Truncates a string to a maximum length with ellipsis.
 * @param text - String to truncate
 * @param max - Maximum length including ellipsis
 * @returns Truncated string
 */
export function truncate(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max - 3) + "...";
}
