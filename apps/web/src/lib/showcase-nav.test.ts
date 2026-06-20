import { describe, expect, it } from "vitest";
import {
  centerStripScrollLeft,
  isMobileShowcaseNav,
  parseShowcaseSectionIds,
  pickActiveSectionId,
  shouldShowFloatNav,
  type SectionRect,
} from "./showcase-nav";

describe("shouldShowFloatNav", () => {
  it("hides float when inline nav is below the fold or still on screen", () => {
    expect(shouldShowFloatNav(820, 72)).toBe(false);
    expect(shouldShowFloatNav(240, 72)).toBe(false);
  });

  it("shows float after inline nav scrolls above the sticky header", () => {
    expect(shouldShowFloatNav(72, 72)).toBe(true);
    expect(shouldShowFloatNav(40, 72)).toBe(true);
  });
});

describe("pickActiveSectionId", () => {
  const viewportHeight = 800;
  const rects: Record<string, SectionRect> = {
    downloads: { top: 120, bottom: 900, height: 780 },
    browse: { top: 920, bottom: 1700, height: 780 },
    converter: { top: 1720, bottom: 2500, height: 780 },
  };

  it("defaults to the first section when none are visible", () => {
    expect(
      pickActiveSectionId(["downloads", "browse"], () => null, viewportHeight)
    ).toBe("downloads");
  });

  it("skips sections that have scrolled above the header exclusion", () => {
    expect(
      pickActiveSectionId(
        ["downloads", "browse"],
        (id) =>
          id === "downloads"
            ? { top: -200, bottom: 80, height: 280 }
            : { top: 200, bottom: 980, height: 780 },
        viewportHeight
      )
    ).toBe("browse");
  });

  it("picks the visible section closest to the marker", () => {
    const id = pickActiveSectionId(
      ["downloads", "browse", "converter"],
      (sectionId) => rects[sectionId],
      viewportHeight
    );

    expect(id).toBe("downloads");
  });

  it("switches active section as the viewport moves down the page", () => {
    const scrolledRects: Record<string, SectionRect> = {
      downloads: { top: -400, bottom: 380, height: 780 },
      browse: { top: 200, bottom: 980, height: 780 },
      converter: { top: 1000, bottom: 1780, height: 780 },
    };

    expect(
      pickActiveSectionId(
        ["downloads", "browse", "converter"],
        (sectionId) => scrolledRects[sectionId],
        viewportHeight
      )
    ).toBe("browse");
  });
});

describe("centerStripScrollLeft", () => {
  it("returns zero when the strip does not overflow", () => {
    expect(centerStripScrollLeft(120, 80, 400, 400)).toBe(0);
  });

  it("centers the active link within the strip", () => {
    expect(centerStripScrollLeft(200, 80, 300, 600)).toBe(90);
  });

  it("clamps to the maximum scroll offset", () => {
    expect(centerStripScrollLeft(520, 80, 300, 600)).toBe(300);
  });
});

describe("isMobileShowcaseNav", () => {
  it("matches the Tailwind sm breakpoint", () => {
    expect(isMobileShowcaseNav(639)).toBe(true);
    expect(isMobileShowcaseNav(640)).toBe(false);
  });
});

describe("parseShowcaseSectionIds", () => {
  it("parses a JSON array of section ids", () => {
    expect(parseShowcaseSectionIds('["downloads","browse"]')).toEqual([
      "downloads",
      "browse",
    ]);
  });

  it("returns an empty array for invalid input", () => {
    expect(parseShowcaseSectionIds(undefined)).toEqual([]);
    expect(parseShowcaseSectionIds("not-json")).toEqual([]);
    expect(parseShowcaseSectionIds('{"id":"downloads"}')).toEqual([]);
  });
});
