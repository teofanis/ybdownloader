import type { ExtensionFormat } from "@ybdownload/shared/formats"
import { EXTENSION_FORMAT_OPTIONS } from "@ybdownload/shared/formats"

export type Format = ExtensionFormat
export type Status = "idle" | "loading" | "success" | "error"

export interface Position {
  x: number
  y: number
}

export type FormatOption = (typeof EXTENSION_FORMAT_OPTIONS)[number]

export const FORMAT_OPTIONS = EXTENSION_FORMAT_OPTIONS

export const BUTTON_SIZE = 56
export const DEFAULT_POSITION: Position = { x: 24, y: 120 }
