import { isDeepLinkFormat, type DeepLinkFormat } from "./formats";

export const DEEP_LINK_PROTOCOL = "ybdownloader";
export const DEEP_LINK_ACTION_ADD = "add";

export interface DeepLinkParams {
  url: string;
  format?: DeepLinkFormat;
}

export function buildDeepLink({ url, format = "mp3" }: DeepLinkParams): string {
  const encodedUrl = encodeURIComponent(url);
  return `${DEEP_LINK_PROTOCOL}://${DEEP_LINK_ACTION_ADD}?url=${encodedUrl}&format=${format}`;
}

export function parseDeepLink(href: string): DeepLinkParams | null {
  if (!href.startsWith(`${DEEP_LINK_PROTOCOL}://`)) {
    return null;
  }

  try {
    const parsed = new URL(href);
    const videoUrl = parsed.searchParams.get("url");
    if (!videoUrl) {
      return null;
    }

    const formatParam = parsed.searchParams.get("format");
    const format =
      formatParam && isDeepLinkFormat(formatParam) ? formatParam : undefined;

    return { url: videoUrl, format };
  } catch {
    return null;
  }
}

/** Trigger a deep link via a temporary anchor (content scripts / extension). */
export function triggerDeepLink(params: DeepLinkParams): void {
  const anchor = document.createElement("a");
  anchor.href = buildDeepLink(params);
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

export function isWatchPage(href: string = window.location.href): boolean {
  return (
    href.includes("youtube.com/watch") ||
    href.includes("music.youtube.com/watch")
  );
}
