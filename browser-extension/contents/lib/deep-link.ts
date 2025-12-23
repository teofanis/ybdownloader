import type { Format } from "../types"

export function triggerDownload(format: Format): void {
  const videoUrl = encodeURIComponent(window.location.href)
  const deepLink = `ybdownloader://add?url=${videoUrl}&format=${format}`

  const anchor = document.createElement("a")
  anchor.href = deepLink
  anchor.style.display = "none"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export function isWatchPage(): boolean {
  const { href } = window.location
  return href.includes("youtube.com/watch") || href.includes("music.youtube.com/watch")
}
