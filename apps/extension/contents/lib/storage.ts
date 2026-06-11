import { DEFAULT_POSITION, BUTTON_SIZE, type Position } from "../types"

const POSITION_KEY = "ybd-button-position"

export function loadPosition(): Position {
  try {
    const saved = localStorage.getItem(POSITION_KEY)
    if (!saved) return DEFAULT_POSITION

    const pos = JSON.parse(saved) as Position
    const isValid =
      pos.x >= 0 &&
      pos.y >= 0 &&
      pos.x < window.innerWidth - BUTTON_SIZE &&
      pos.y < window.innerHeight - BUTTON_SIZE

    return isValid ? pos : DEFAULT_POSITION
  } catch {
    return DEFAULT_POSITION
  }
}

export function savePosition(pos: Position): void {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(pos))
  } catch (error) {
    console.warn("Failed to save position", error)
  }
}
