import { useRef, useEffect, useState, useCallback, type FC, type KeyboardEvent } from "react"
import { FORMAT_OPTIONS, BUTTON_SIZE, type Format } from "../types"
import { openGitHub, openReleases, openSponsor } from "../lib/deep-link"
import styles from "../youtube-overlay.module.css"

const MENU_HEIGHT = 280

interface Props {
  buttonY: number
  onSelect: (format: Format) => void
  onClose: () => void
}

export const FormatMenu: FC<Props> = ({ buttonY, onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null)
  const [focusIndex, setFocusIndex] = useState(0)

  const spaceBelow = window.innerHeight - buttonY - BUTTON_SIZE - 16
  const openAbove = spaceBelow < MENU_HEIGHT

  useEffect(() => {
    menuRef.current?.querySelector("button")?.focus()
  }, [])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent, index: number) => {
      const len = FORMAT_OPTIONS.length
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault()
          setFocusIndex((i) => (i + 1) % len)
          break
        case "ArrowUp":
          e.preventDefault()
          setFocusIndex((i) => (i - 1 + len) % len)
          break
        case "Home":
          e.preventDefault()
          setFocusIndex(0)
          break
        case "End":
          e.preventDefault()
          setFocusIndex(len - 1)
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

  useEffect(() => {
    const items = menuRef.current?.querySelectorAll("button")
    items?.[focusIndex]?.focus()
  }, [focusIndex])

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Download format"
      className={`${styles.dropdown} ${openAbove ? styles.dropdownAbove : styles.dropdownBelow}`}
    >
      <div className={styles.dropdownHeader}>Download Format</div>

      {FORMAT_OPTIONS.map((opt, i) => (
        <button
          key={opt.id}
          type="button"
          role="menuitem"
          tabIndex={0}
          className={styles.menuItem}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(opt.id)
          }}
          onKeyDown={(e) => handleKeyDown(e, i)}
        >
          <span className={styles.menuItemIcon}>{opt.icon}</span>
          <div>
            <div className={styles.menuItemLabel}>{opt.label}</div>
            <div className={styles.menuItemDesc}>{opt.description}</div>
          </div>
        </button>
      ))}

      {/* Quick Links */}
      <div className={styles.dropdownLinks}>
        <button
          type="button"
          className={styles.dropdownLink}
          onClick={openReleases}
          title="Download App"
        >
          <DownloadIcon />
        </button>
        <button
          type="button"
          className={styles.dropdownLink}
          onClick={openGitHub}
          title="Star on GitHub"
        >
          <StarIcon />
        </button>
        <button type="button" className={styles.dropdownLink} onClick={openSponsor} title="Sponsor">
          <HeartIcon />
        </button>
      </div>
    </div>
  )
}

const DownloadIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>
)

const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
  </svg>
)

const HeartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
)
