import { describe, expect, it } from "vitest";
import {
  buildLiveData,
  desktopTitleLabel,
  downloadCtaLabel,
  patchLiveData,
  starBadgeLabel,
  starLinkAriaLabel,
  type LiveDom,
} from "./live-data";

describe("buildLiveData", () => {
  it("normalizes desktop tag and preserves stars", () => {
    const data = buildLiveData(2400, "v1.4.0");

    expect(data.stars).toBe(2400);
    expect(data.version).toBe("1.4.0");
    expect(data.builtAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("falls back to latest when no release tag is available", () => {
    const data = buildLiveData(0, null);

    expect(data.version).toBe("latest");
  });
});

describe("live labels", () => {
  it("formats download and desktop labels", () => {
    expect(downloadCtaLabel("1.2.3")).toBe("Download v1.2.3");
    expect(desktopTitleLabel("1.2.3")).toBe("Desktop app v1.2.3");
    expect(starBadgeLabel(2400)).toBe("2.4k");
    expect(starLinkAriaLabel("YBDownloader", 42)).toBe(
      "Star YBDownloader on GitHub (42 stars)"
    );
  });
});

describe("patchLiveData", () => {
  it("updates starred and version hooks in the document", () => {
    const stars = document.createElement("span");
    stars.setAttribute("data-live-stars", "");
    stars.textContent = "1k";

    const version = document.createElement("span");
    version.setAttribute("data-live-version", "");
    version.textContent = "1.0.0";

    const cta = document.createElement("a");
    cta.setAttribute("data-live-cta", "download");
    cta.textContent = "Download v1.0.0";

    const title = document.createElement("h1");
    title.setAttribute("data-live-title", "desktop");
    title.textContent = "Desktop app v1.0.0";

    const link = document.createElement("a");
    link.setAttribute("data-live-stars-link", "");
    link.append(stars);

    const root: LiveDom = {
      querySelectorAll(selector: string) {
        if (selector === "[data-live-stars]") return [stars];
        if (selector === "[data-live-version]") return [version];
        if (selector === '[data-live-cta="download"]') return [cta];
        if (selector === '[data-live-title="desktop"]') return [title];
        if (selector === "[data-live-stars-link]") return [link];
        return [];
      },
    };

    patchLiveData(
      root,
      {
        stars: 2500,
        version: "1.5.0",
        builtAt: "2026-06-15T12:00:00.000Z",
      },
      "YBDownloader"
    );

    expect(stars.textContent).toBe("2.5k");
    expect(version.textContent).toBe("1.5.0");
    expect(cta.textContent).toBe("Download v1.5.0");
    expect(title.textContent).toBe("Desktop app v1.5.0");
    expect(link.getAttribute("aria-label")).toBe(
      "Star YBDownloader on GitHub (2,500 stars)"
    );
  });

  it("skips DOM writes when values are already current", () => {
    const stars = document.createElement("span");
    stars.setAttribute("data-live-stars", "");
    stars.textContent = "2.5k";

    const root: LiveDom = {
      querySelectorAll(selector: string) {
        if (selector === "[data-live-stars]") return [stars];
        return [];
      },
    };

    patchLiveData(
      root,
      {
        stars: 2500,
        version: "1.5.0",
        builtAt: "2026-06-15T12:00:00.000Z",
      },
      "YBDownloader"
    );

    expect(stars.textContent).toBe("2.5k");
  });
});
