/** All formats supported by the desktop app backend. */
export const DESKTOP_FORMATS = ["mp3", "m4a", "mp4"] as const;
export type DesktopFormat = (typeof DESKTOP_FORMATS)[number];

/** Formats accepted in ybdownloader:// deep links (Go handler). */
export const DEEP_LINK_FORMATS = ["mp3", "mp4", "webm"] as const;
export type DeepLinkFormat = (typeof DEEP_LINK_FORMATS)[number];

/** Formats offered by the browser extension overlay. */
export const EXTENSION_FORMATS = ["mp3", "mp4", "webm"] as const;
export type ExtensionFormat = (typeof EXTENSION_FORMATS)[number];

export const ALL_FORMATS = ["mp3", "m4a", "mp4", "webm"] as const;
export type Format = (typeof ALL_FORMATS)[number];

export function isDeepLinkFormat(value: string): value is DeepLinkFormat {
  return (DEEP_LINK_FORMATS as readonly string[]).includes(value);
}

export function isDesktopFormat(value: string): value is DesktopFormat {
  return (DESKTOP_FORMATS as readonly string[]).includes(value);
}

export function isAudioFormat(format: Format): boolean {
  return format === "mp3" || format === "m4a";
}

export interface FormatOption {
  id: ExtensionFormat;
  icon: string;
  label: string;
  description: string;
}

export const EXTENSION_FORMAT_OPTIONS: FormatOption[] = [
  { id: "mp3", icon: "🎵", label: "MP3", description: "Audio only" },
  { id: "mp4", icon: "🎬", label: "MP4", description: "Video + Audio" },
  { id: "webm", icon: "📦", label: "WebM", description: "Original quality" },
];
