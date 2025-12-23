import type { Format } from "../types"

export const GITHUB_URL = "https://github.com/teofanis/ybdownloader"
export const RELEASES_URL = "https://github.com/teofanis/ybdownloader/releases"
export const SPONSOR_URL = "https://buymeacoffee.com/teofanis"

export function isWatchPage(): boolean {
  const { href } = window.location
  return href.includes("youtube.com/watch") || href.includes("music.youtube.com/watch")
}

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

export function openGitHub(): void {
  window.open(GITHUB_URL, "_blank")
}

export function openReleases(): void {
  window.open(RELEASES_URL, "_blank")
}

export function openSponsor(): void {
  window.open(SPONSOR_URL, "_blank")
}
