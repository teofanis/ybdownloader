import { useState, useRef, useEffect, useCallback, type FC } from "react"
import { useWatchPage, useDraggable, useClickOutside } from "../hooks"
import { loadPosition } from "../lib/storage"
import { triggerDownload } from "../lib/deep-link"
import type { Format, Status } from "../types"
import { StatusIcon } from "./Icons"
import { FormatMenu } from "./FormatMenu"
import styles from "../youtube-overlay.module.css"

export const FloatingButton: FC = () => {
  const isVisible = useWatchPage()
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<Status>("idle")

  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { position, isDragging, handleMouseDown, shouldPreventClick } = useDraggable(loadPosition())

  useEffect(() => {
    if (!isVisible) {
      setIsOpen(false)
      setStatus("idle")
    }
  }, [isVisible])

  useClickOutside(containerRef, isOpen, () => setIsOpen(false))

  const handleClick = useCallback(() => {
    if (shouldPreventClick()) return
    if (!isDragging && status === "idle") {
      setIsOpen((prev) => !prev)
    }
  }, [isDragging, status, shouldPreventClick])

  const handleDownload = useCallback((format: Format) => {
    setStatus("loading")
    setIsOpen(false)
    triggerDownload(format)

    setTimeout(() => {
      setStatus("success")
      setTimeout(() => setStatus("idle"), 1500)
    }, 300)
  }, [])

  if (!isVisible) return null

  const fabClass = [
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
      <button
        ref={buttonRef}
        type="button"
        className={fabClass}
        onClick={handleClick}
        onMouseDown={(e) => handleMouseDown(e, buttonRef.current?.getBoundingClientRect())}
        disabled={status === "loading"}
        aria-label="Download video"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={isDragging ? "Release to place" : "Click to download · Drag to move"}
      >
        <StatusIcon status={status} className={status === "loading" ? styles.spinner : undefined} />
      </button>

      {isOpen && (
        <FormatMenu
          buttonY={position.y}
          onSelect={handleDownload}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
