import type { ExtensionFormat } from "@ybdownload/shared/formats"
import { GITHUB_RELEASES_URL, GITHUB_REPO_URL, SPONSOR_URL } from "@ybdownload/shared/urls"
import { buildDeepLink, isWatchPage, triggerDeepLink } from "@ybdownload/shared/deep-link"

export {
  GITHUB_REPO_URL as GITHUB_URL,
  GITHUB_RELEASES_URL as RELEASES_URL,
  SPONSOR_URL,
  isWatchPage
}

export function triggerDownload(format: ExtensionFormat): void {
  triggerDeepLink({ url: window.location.href, format })
}

export function openGitHub(): void {
  window.open(GITHUB_REPO_URL, "_blank")
}

export function openReleases(): void {
  window.open(GITHUB_RELEASES_URL, "_blank")
}

export function openSponsor(): void {
  window.open(SPONSOR_URL, "_blank")
}

export { buildDeepLink }
