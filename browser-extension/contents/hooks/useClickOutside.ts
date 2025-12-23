import { useEffect, type RefObject } from "react"

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
  onClickOutside: () => void
) {
  useEffect(() => {
    if (!isActive) return

    const handleClick = (e: MouseEvent) => {
      if (!ref.current) return

      // Use composedPath for Shadow DOM compatibility
      const path = e.composedPath()
      const isInside = path.includes(ref.current)

      if (!isInside) {
        onClickOutside()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClickOutside()
    }

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClick, true)
      document.addEventListener("keydown", handleEscape, true)
    }, 10)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("mousedown", handleClick, true)
      document.removeEventListener("keydown", handleEscape, true)
    }
  }, [isActive, onClickOutside, ref])
}
