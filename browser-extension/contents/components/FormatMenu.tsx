import { useRef, useEffect, useState, useCallback, type FC, type KeyboardEvent } from "react"
import { FORMAT_OPTIONS, BUTTON_SIZE, type Format } from "../types"
import styles from "../youtube-overlay.module.css"

const MENU_HEIGHT = 200

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

      <div className={styles.dropdownFooter}>
        Drag to move · <kbd className={styles.kbd}>Esc</kbd> to close
      </div>
    </div>
  )
}
