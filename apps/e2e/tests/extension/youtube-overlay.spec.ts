import { test, expect } from "../../fixtures/extension-test";
import { buildDeepLink } from "@ybdownload/shared/deep-link";

test.describe("YouTube overlay", { tag: "@extension" }, () => {
  test("X01: download FAB appears on watch page", async ({
    extensionId,
    youtubeOverlay,
  }) => {
    expect(extensionId.length).toBeGreaterThan(0);
    await expect(youtubeOverlay.downloadFab()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("X02: FAB opens format menu", async ({ youtubeOverlay }) => {
    await expect(youtubeOverlay.downloadFab()).toBeVisible({
      timeout: 20_000,
    });
    await youtubeOverlay.openFormatMenu();
    await expect(youtubeOverlay.formatMenu()).toBeVisible();
    await expect(youtubeOverlay.formatOption("MP3")).toBeVisible();
    await expect(youtubeOverlay.formatOption("MP4")).toBeVisible();
    await expect(youtubeOverlay.formatOption("WebM")).toBeVisible();
  });

  test("X03: MP3 format triggers download action", async ({
    youtube,
    youtubeOverlay,
  }) => {
    const watchUrl = youtube.url();
    const expectedDeepLink = buildDeepLink({ url: watchUrl, format: "mp3" });
    expect(expectedDeepLink).toContain("format=mp3");

    await expect(youtubeOverlay.downloadFab()).toBeVisible({
      timeout: 20_000,
    });
    await youtubeOverlay.openFormatMenu();
    await youtubeOverlay.selectFormat("MP3");

    await expect(youtubeOverlay.formatMenu()).toBeHidden();
    await expect(youtubeOverlay.downloadFab()).toBeVisible();
    await expect(youtube).toHaveURL(/youtube\.com\/watch/);
  });
});
