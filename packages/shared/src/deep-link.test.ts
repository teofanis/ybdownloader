import { describe, expect, it } from "vitest";
import { buildDeepLink, parseDeepLink } from "./deep-link";

describe("buildDeepLink", () => {
  it("builds add URL with encoded video URL and format", () => {
    const link = buildDeepLink({
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      format: "mp3",
    });
    expect(link).toBe(
      "ybdownloader://add?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DdQw4w9WgXcQ&format=mp3",
    );
  });

  it("defaults format to mp3", () => {
    const link = buildDeepLink({ url: "https://youtu.be/dQw4w9WgXcQ" });
    expect(link).toContain("&format=mp3");
  });
});

describe("parseDeepLink", () => {
  it("parses valid deep links", () => {
    const href =
      "ybdownloader://add?url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3Dabc&format=webm";
    expect(parseDeepLink(href)).toEqual({
      url: "https://www.youtube.com/watch?v=abc",
      format: "webm",
    });
  });

  it("returns null for invalid links", () => {
    expect(parseDeepLink("https://example.com")).toBeNull();
    expect(parseDeepLink("ybdownloader://add")).toBeNull();
  });
});
