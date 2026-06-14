import { describe, expect, it } from "vitest";
import {
  isDesktopReleaseTag,
  isExtensionReleaseTag,
  isPrereleaseVersion,
  matchesUpdateChannel,
  partitionDesktopReleases,
  selectLatestDesktopRelease,
} from "./releases";

const release = (tag_name: string, prerelease: boolean, draft = false) => ({
  tag_name,
  prerelease,
  draft,
});

describe("releases", () => {
  it("identifies desktop and extension tags", () => {
    expect(isDesktopReleaseTag("v1.0.2")).toBe(true);
    expect(isDesktopReleaseTag("v1.0.0-beta.1")).toBe(true);
    expect(isDesktopReleaseTag("ext-v0.0.4")).toBe(false);
    expect(isExtensionReleaseTag("ext-v0.0.4")).toBe(true);
  });

  it("detects prerelease versions", () => {
    expect(isPrereleaseVersion("1.0.0-beta.1")).toBe(true);
    expect(isPrereleaseVersion("v1.0.0-rc.1")).toBe(true);
    expect(isPrereleaseVersion("1.0.0")).toBe(false);
    expect(isPrereleaseVersion("0.0.0-dev")).toBe(false);
  });

  it("selects stable desktop releases and skips extensions", () => {
    const releases = [
      release("ext-v0.0.4", false),
      release("v1.0.2", false),
      release("v1.0.0-beta.1", true),
    ];

    expect(selectLatestDesktopRelease(releases, "stable")?.tag_name).toBe(
      "v1.0.2",
    );
    expect(matchesUpdateChannel(releases[2], "stable")).toBe(false);
    expect(matchesUpdateChannel(releases[2], "beta")).toBe(true);
  });

  it("selects beta channel prereleases only", () => {
    const releases = [
      release("v1.0.2", false),
      release("v1.0.0-beta.2", true),
      release("v1.0.0-beta.1", true),
    ];

    expect(selectLatestDesktopRelease(releases, "beta")?.tag_name).toBe(
      "v1.0.0-beta.2",
    );
    expect(selectLatestDesktopRelease(releases, "stable")?.tag_name).toBe(
      "v1.0.2",
    );
    expect(
      selectLatestDesktopRelease([release("v1.0.2", false)], "beta"),
    ).toBeNull();
  });

  it("partitions desktop releases", () => {
    const releases = [
      release("ext-v0.0.4", false),
      release("v1.0.2", false),
      release("v1.0.0-beta.1", true),
    ];

    const { stable, prerelease } = partitionDesktopReleases(releases);
    expect(stable.map((r) => r.tag_name)).toEqual(["v1.0.2"]);
    expect(prerelease.map((r) => r.tag_name)).toEqual(["v1.0.0-beta.1"]);
  });
});
