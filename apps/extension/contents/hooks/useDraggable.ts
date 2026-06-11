import { useState, useEffect, useCallback, useRef } from "react"
import { BUTTON_SIZE, type Position } from "../types"
import { savePosition } from "../lib/storage"

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function useDraggable(initialPosition: Position) {
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
      setPosition({
        x: clamp(e.clientX - dragOffset.current.x, 0, window.innerWidth - BUTTON_SIZE),
        y: clamp(e.clientY - dragOffset.current.y, 0, window.innerHeight - BUTTON_SIZE)
      })
    }

    const onUp = () => {
      if (hasMoved.current) {
        justFinishedDragging.current = true
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

  useEffect(() => {
    if (!isDragging) savePosition(position)
  }, [position, isDragging])

  const shouldPreventClick = useCallback(() => justFinishedDragging.current, [])

  return { position, isDragging, handleMouseDown, shouldPreventClick }
}
