/**
 * YBDownloader - YouTube Overlay Content Script UI
 *
 * A floating action button that allows users to add YouTube videos
 * to YBDownloader with a single click.
 *
 * @see https://docs.plasmo.com/framework/content-scripts-ui
 * @see https://docs.plasmo.com/framework/content-scripts-ui/styling#css-modules
 */
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type FC,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent
} from "react"

// CSS Modules: Import twice - once as text for Shadow DOM injection, once for class names
// @see https://docs.plasmo.com/framework/content-scripts-ui/styling#css-modules
import styleText from "data-text:./youtube-overlay.module.css"
import * as styles from "./youtube-overlay.module.css"

// ============================================================================
// Plasmo Configuration
// ============================================================================

export const config: PlasmoCSConfig = {
  matches: ["https://www.youtube.com/*", "https://youtube.com/*", "https://music.youtube.com/*"],
  run_at: "document_end"
}

// Unique ID for the Shadow DOM host element
export const getShadowHostId = () => "ybd-overlay-host"

// Inject styles into Shadow DOM
// @see https://docs.plasmo.com/framework/content-scripts-ui/styling#styling-the-shadow-dom
export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = styleText
  return style
}

// ============================================================================
// Constants & Types
// ============================================================================

const POSITION_KEY = "ybd-button-position"

type Format = "mp3" | "mp4" | "webm"
type Status = "idle" | "loading" | "success" | "error"
type DropdownPosition = "below" | "above"

interface Position {
  x: number
  y: number
}

interface FormatOption {
  id: Format
  icon: string
  label: string
  description: string
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: "mp3", icon: "🎵", label: "MP3", description: "Audio only" },
  { id: "mp4", icon: "🎬", label: "MP4", description: "Video + Audio" },
  { id: "webm", icon: "📦", label: "WebM", description: "Original quality" }
]

const DEFAULT_POSITION: Position = { x: 24, y: 120 }
const BUTTON_SIZE = 56
const DROPDOWN_HEIGHT = 200 // Approximate height for collision detection

// ============================================================================
// Utilities
// ============================================================================

function isWatchPage(): boolean {
  const { href } = window.location
  return href.includes("youtube.com/watch") || href.includes("music.youtube.com/watch")
}

function loadPosition(): Position {
  try {
    const saved = localStorage.getItem(POSITION_KEY)
    if (saved) {
      const pos = JSON.parse(saved) as Position
      if (isValidPosition(pos)) {
        return pos
      }
    }
  } catch {
    /* use default */
  }
  return DEFAULT_POSITION
}

function isValidPosition(pos: Position): boolean {
  return (
    typeof pos.x === "number" &&
    typeof pos.y === "number" &&
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x < window.innerWidth - BUTTON_SIZE &&
    pos.y < window.innerHeight - BUTTON_SIZE
  )
}

function savePosition(pos: Position): void {
  try {
    localStorage.setItem(POSITION_KEY, JSON.stringify(pos))
  } catch {}
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * Hook to detect if we're on a YouTube watch page
 */
function useWatchPageDetection() {
  const [isVisible, setIsVisible] = useState(isWatchPage)

  useEffect(() => {
    const check = () => setIsVisible(isWatchPage())

    // YouTube SPA navigation events
    const onNav = () => setTimeout(check, 150)
    window.addEventListener("yt-navigate-finish", onNav)
    window.addEventListener("popstate", onNav)

    // Fallback interval for edge cases
    const interval = setInterval(check, 2000)

    return () => {
      window.removeEventListener("yt-navigate-finish", onNav)
      window.removeEventListener("popstate", onNav)
      clearInterval(interval)
    }
  }, [])

  return isVisible
}

/**
 * Hook to handle draggable positioning
 */
function useDraggable(initialPosition: Position) {
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef<Position>({ x: 0, y: 0 })
  const hasMoved = useRef(false)
  const justFinishedDragging = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent, buttonRect: DOMRect | undefined) => {
    if (e.button !== 0 || !buttonRect) return

    setIsDragging(true)
    hasMoved.current = false
    justFinishedDragging.current = false
    dragOffset.current = {
      x: e.clientX - buttonRect.left,
      y: e.clientY - buttonRect.top
    }
    e.preventDefault()
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const onMove = (e: MouseEvent) => {
      hasMoved.current = true
      const x = clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth - BUTTON_SIZE)
      const y = clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - BUTTON_SIZE)
      setPosition({ x, y })
    }

    const onUp = () => {
      // If we moved, mark that we just finished dragging to prevent click
      if (hasMoved.current) {
        justFinishedDragging.current = true
        // Reset after a short delay (click event fires ~10ms after mouseup)
        setTimeout(() => {
          justFinishedDragging.current = false
        }, 100)
      }
      setIsDragging(false)
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)

    return () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
  }, [isDragging])

  // Persist position when drag ends
  useEffect(() => {
    if (!isDragging) {
      savePosition(position)
    }
  }, [position, isDragging])

  // Check if we should prevent click (just finished dragging with movement)
  const shouldPreventClick = useCallback(() => justFinishedDragging.current, [])

  return { position, isDragging, handleMouseDown, shouldPreventClick }
}

/**
 * Hook to handle click outside detection
 */
function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
  onClose: () => void
) {
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    // Delay to avoid catching the click that opened the dropdown
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose, ref])
}

// ============================================================================
// Components
// ============================================================================

/**
 * Status icon displayed in the FAB
 */
const StatusIcon: FC<{ status: Status }> = ({ status }) => {
  switch (status) {
    case "loading":
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={styles.spinner}
        >
          <circle cx="12" cy="12" r="10" opacity="0.2" />
          <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
        </svg>
      )
    case "success":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
      )
    case "error":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </svg>
      )
    default:
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
        </svg>
      )
  }
}

/**
 * Individual menu item in the dropdown
 */
const MenuItem: FC<{
  option: FormatOption
  onClick: () => void
  onKeyDown: (e: ReactKeyboardEvent) => void
}> = ({ option, onClick, onKeyDown }) => (
  <button
    type="button"
    role="menuitem"
    className={styles.menuItem}
    onClick={onClick}
    onKeyDown={onKeyDown}
    tabIndex={0}
  >
    <span className={styles.menuItemIcon} aria-hidden="true">
      {option.icon}
    </span>
    <div>
      <div className={styles.menuItemLabel}>{option.label}</div>
      <div className={styles.menuItemDesc}>{option.description}</div>
    </div>
  </button>
)

/**
 * Dropdown menu with smart positioning (opens above if not enough space below)
 */
const DropdownMenu: FC<{
  buttonY: number
  onSelect: (format: Format) => void
  onClose: () => void
  children?: ReactNode
}> = ({ buttonY, onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusIndex, setFocusIndex] = useState(0)

  // Determine if dropdown should open above or below
  const spaceBelow = window.innerHeight - buttonY - BUTTON_SIZE - 16
  const position: DropdownPosition = spaceBelow < DROPDOWN_HEIGHT ? "above" : "below"

  // Focus first item on mount
  useEffect(() => {
    const firstItem = menuRef.current?.querySelector("button")
    firstItem?.focus()
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: ReactKeyboardEvent, index: number) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusIndex((prev) => (prev + 1) % FORMAT_OPTIONS.length)
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusIndex((prev) => (prev - 1 + FORMAT_OPTIONS.length) % FORMAT_OPTIONS.length)
          break
        case "Home":
          e.preventDefault()
          setFocusIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusIndex(FORMAT_OPTIONS.length - 1)
          break
        case "Enter":
        case " ":
          e.preventDefault()
          onSelect(FORMAT_OPTIONS[index].id)
          break
        case "Tab":
          e.preventDefault()
          onClose()
          break
      }
    },
    [onSelect, onClose]
  )

  // Focus management
  useEffect(() => {
    const items = menuRef.current?.querySelectorAll("button")
    items?.[focusIndex]?.focus()
  }, [focusIndex])

  const dropdownClass = `${styles.dropdown} ${
    position === "above" ? styles.dropdownAbove : styles.dropdownBelow
  }`

  return (
    <div ref={menuRef} role="menu" aria-label="Download format" className={dropdownClass}>
      <div className={styles.dropdownHeader}>Download Format</div>

      {FORMAT_OPTIONS.map((option, index) => (
        <MenuItem
          key={option.id}
          option={option}
          onClick={() => onSelect(option.id)}
          onKeyDown={(e) => handleKeyDown(e, index)}
        />
      ))}

      <div className={styles.dropdownFooter}>
        Drag button to reposition • <kbd className={styles.kbd}>Esc</kbd> to close
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

function YBDownloaderOverlay() {
  const isVisible = useWatchPageDetection()
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<Status>("idle")

  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { position, isDragging, handleMouseDown, shouldPreventClick } = useDraggable(loadPosition())

  // Close dropdown when navigating away
  useEffect(() => {
    if (!isVisible) {
      setIsOpen(false)
      setStatus("idle")
    }
  }, [isVisible])

  // Click outside to close
  useClickOutside(containerRef, isOpen, () => setIsOpen(false))

  // Button click handler
  const handleButtonClick = useCallback(() => {
    // Prevent click if we just finished dragging (with movement)
    if (shouldPreventClick()) return

    if (!isDragging && status === "idle") {
      setIsOpen((prev) => !prev)
    }
  }, [isDragging, status, shouldPreventClick])

  // Download handler
  const handleDownload = useCallback((format: Format) => {
    const videoUrl = encodeURIComponent(window.location.href)
    const deepLink = `ybdownloader://add?url=${videoUrl}&format=${format}`

    setStatus("loading")
    setIsOpen(false)

    // Trigger deep link via anchor element
    const anchor = document.createElement("a")
    anchor.href = deepLink
    anchor.style.display = "none"
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    // Optimistic success feedback
    setTimeout(() => {
      setStatus("success")
      setTimeout(() => setStatus("idle"), 1500)
    }, 300)
  }, [])

  // Don't render if not on a watch page
  if (!isVisible) return null

  // Build FAB class names
  const fabClasses = [
    styles.fab,
    isDragging && styles.fabDragging,
    status === "loading" && styles.fabLoading,
    status === "success" && styles.fabSuccess,
    status === "error" && styles.fabError
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div
      ref={containerRef}
      className={styles.container}
      style={{ left: position.x, top: position.y }}
    >
      {/* Floating Action Button */}
      <button
        ref={buttonRef}
        type="button"
        className={fabClasses}
        onClick={handleButtonClick}
        onMouseDown={(e) => handleMouseDown(e, buttonRef.current?.getBoundingClientRect())}
        disabled={status === "loading"}
        aria-label="Download video"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={isDragging ? "Release to place" : "Click to download • Drag to move"}
      >
        <StatusIcon status={status} />
      </button>

      {/* Format Selection Dropdown */}
      {isOpen && (
        <DropdownMenu
          buttonY={position.y}
          onSelect={handleDownload}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}

export default YBDownloaderOverlay
