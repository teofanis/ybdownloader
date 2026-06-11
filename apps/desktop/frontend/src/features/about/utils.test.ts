import { describe, it, expect } from "vitest";
import { formatVersion, GITHUB_RELEASES_URL } from "./utils";

describe("about utils", () => {
  it("strips leading v from version strings", () => {
    expect(formatVersion("v1.2.3")).toBe("1.2.3");
    expect(formatVersion("1.2.3")).toBe("1.2.3");
  });

  it("exports github releases url", () => {
    expect(GITHUB_RELEASES_URL).toContain("github.com");
  });
});
