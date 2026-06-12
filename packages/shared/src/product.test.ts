import { describe, expect, it } from "vitest";
import { ALL_FORMATS } from "./formats";
import {
  APP_TABS,
  DESKTOP_LOCALES,
  DESKTOP_PLATFORMS,
  PRODUCT_LABELS,
  PRODUCT_STATS,
  getProductHighlights,
} from "./product";

describe("product config", () => {
  it("derives stats from canonical lists", () => {
    expect(PRODUCT_STATS.tabs).toBe(APP_TABS.length);
    expect(PRODUCT_STATS.locales).toBe(DESKTOP_LOCALES.length);
    expect(PRODUCT_STATS.formats).toBe(ALL_FORMATS.length);
    expect(PRODUCT_STATS.platforms).toBe(DESKTOP_PLATFORMS.length);
  });

  it("formats marketing labels", () => {
    expect(PRODUCT_LABELS.formats).toBe("MP3 · M4A · MP4 · WebM");
    expect(PRODUCT_LABELS.platforms).toBe("Windows · macOS · Linux");
  });

  it("builds highlight cards from stats", () => {
    const highlights = getProductHighlights();
    expect(highlights).toHaveLength(4);
    expect(highlights[1]).toEqual({
      value: String(DESKTOP_LOCALES.length),
      label: "languages",
    });
  });
});
