import { formatVersion } from "@ybdownload/shared/urls";
import { formatStarCount } from "./github";

export interface LiveData {
  stars: number;
  version: string;
  builtAt: string;
}

export function buildLiveData(stars: number, tagName: string | null): LiveData {
  return {
    stars,
    version: tagName ? formatVersion(tagName) : "latest",
    builtAt: new Date().toISOString(),
  };
}

export function downloadCtaLabel(version: string): string {
  return `Download v${version}`;
}

export function desktopTitleLabel(version: string): string {
  return `Desktop app v${version}`;
}

export function starBadgeLabel(stars: number): string {
  return formatStarCount(stars);
}

export function starLinkAriaLabel(appName: string, stars: number): string {
  if (stars > 0) {
    return `Star ${appName} on GitHub (${stars.toLocaleString("en-US")} stars)`;
  }
  return `Star ${appName} on GitHub`;
}

export interface LiveDom {
  querySelectorAll(selector: string): Iterable<Element>;
}

function setTextIfChanged(element: Element, value: string): void {
  if (element.textContent !== value) {
    element.textContent = value;
  }
}

function setAriaLabelIfChanged(element: Element, value: string): void {
  if (element.getAttribute("aria-label") !== value) {
    element.setAttribute("aria-label", value);
  }
}

export function patchLiveData(
  root: LiveDom,
  data: LiveData,
  appName: string
): void {
  const starsLabel = starBadgeLabel(data.stars);
  const downloadLabel = downloadCtaLabel(data.version);
  const desktopLabel = desktopTitleLabel(data.version);
  const linkLabel = starLinkAriaLabel(appName, data.stars);

  for (const element of root.querySelectorAll("[data-live-stars]")) {
    setTextIfChanged(element, starsLabel);
  }

  for (const element of root.querySelectorAll("[data-live-version]")) {
    setTextIfChanged(element, data.version);
  }

  for (const element of root.querySelectorAll('[data-live-cta="download"]')) {
    setTextIfChanged(element, downloadLabel);
  }

  for (const element of root.querySelectorAll('[data-live-title="desktop"]')) {
    setTextIfChanged(element, desktopLabel);
  }

  for (const link of root.querySelectorAll("[data-live-stars-link]")) {
    setAriaLabelIfChanged(link, linkLabel);
  }
}
