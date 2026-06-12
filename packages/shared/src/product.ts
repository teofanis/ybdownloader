import { ALL_FORMATS } from "./formats";
import meta from "./product.meta.json";

export const DESKTOP_LOCALES = meta.desktopLocales;
export const APP_TABS = meta.appTabs;
export const DESKTOP_PLATFORMS = meta.desktopPlatforms;

export type DesktopLocale = (typeof DESKTOP_LOCALES)[number];
export type AppTab = (typeof APP_TABS)[number];

const FORMAT_LABELS: Record<string, string> = {
  mp3: "MP3",
  m4a: "M4A",
  mp4: "MP4",
  webm: "WebM",
};

export function formatProductList(
  items: readonly string[],
  style: "upper" | "title" | "format" = "upper",
  separator = " · ",
): string {
  return items
    .map((item) => {
      if (style === "format") {
        return FORMAT_LABELS[item] ?? item.toUpperCase();
      }
      return style === "upper" ? item.toUpperCase() : item;
    })
    .join(separator);
}

export const PRODUCT_STATS = {
  tabs: APP_TABS.length,
  locales: DESKTOP_LOCALES.length,
  formats: ALL_FORMATS.length,
  platforms: DESKTOP_PLATFORMS.length,
} as const;

export const PRODUCT_LABELS = {
  formats: formatProductList(ALL_FORMATS, "format"),
  platforms: DESKTOP_PLATFORMS.join(" · "),
} as const;

export interface ProductHighlight {
  value: string;
  label: string;
}

export function getProductHighlights(): ProductHighlight[] {
  return [
    { value: String(PRODUCT_STATS.tabs), label: "core tabs" },
    { value: String(PRODUCT_STATS.locales), label: "languages" },
    { value: String(PRODUCT_STATS.formats), label: "download formats" },
    { value: String(PRODUCT_STATS.platforms), label: "desktop platforms" },
  ];
}
