export type Format = "mp3" | "mp4" | "webm"
export type Status = "idle" | "loading" | "success" | "error"

export interface Position {
  x: number
  y: number
}

export interface FormatOption {
  id: Format
  icon: string
  label: string
  description: string
}

export const FORMAT_OPTIONS: FormatOption[] = [
  { id: "mp3", icon: "🎵", label: "MP3", description: "Audio only" },
  { id: "mp4", icon: "🎬", label: "MP4", description: "Video + Audio" },
  { id: "webm", icon: "📦", label: "WebM", description: "Original quality" }
]

export const BUTTON_SIZE = 56
export const DEFAULT_POSITION: Position = { x: 24, y: 120 }
