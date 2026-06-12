import { test, expect } from "../../fixtures/test";
import {
  SAMPLE_DOWNLOADING_ITEM,
  SAMPLE_QUEUE_ITEM,
} from "../../helpers/fixtures";
import { emitWailsEvent } from "../../helpers/mock-runtime";
import { DownloadsPage } from "../../pages/downloads.page";

test.describe("Wails events", { tag: "@full" }, () => {
  test("E01: deeplink:added shows toast", async ({ app, page }) => {
    await app.goto();
    await emitWailsEvent(page, "deeplink:added", SAMPLE_QUEUE_ITEM);
    await expect(
      page.getByText("Added to queue", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Video added from browser extension").first(),
    ).toBeVisible();
  });

  test("E02: deeplink:error shows destructive toast", async ({ app, page }) => {
    await app.goto();
    await emitWailsEvent(page, "deeplink:error", "Invalid YouTube URL");
    await expect(
      page.getByText("Failed to add", { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Invalid YouTube URL").first()).toBeVisible();
  });

  test("E03: navigate event switches tab", async ({ app, page }) => {
    await app.goto();
    await emitWailsEvent(page, "navigate", "settings");
    await app.expectActiveTab("Settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("E04: queue:updated refreshes list", async ({ app, page }) => {
    await app.goto();
    const downloads = new DownloadsPage(page);
    await expect(downloads.emptyQueueMessage()).toBeVisible();

    await emitWailsEvent(page, "queue:updated", [SAMPLE_QUEUE_ITEM]);
    await expect(downloads.queueItemTitle("E2E Sample Video")).toBeVisible();
    await expect(downloads.queueItemCountLabel(1)).toBeVisible();
  });

  test.describe("with downloading item", () => {
    test.use({
      wailsMock: {
        queue: [SAMPLE_DOWNLOADING_ITEM],
      },
    });

    test("E05: download:progress updates bar", async ({ app, page }) => {
      await app.goto();
      const progressBar = page.getByRole("progressbar");
      await expect(progressBar).toBeVisible();

      await emitWailsEvent(page, "download:progress", {
        itemId: SAMPLE_DOWNLOADING_ITEM.id,
        state: "downloading",
        percent: 75,
        downloadedBytes: 7_500_000,
        totalBytes: 10_000_000,
        speed: 1_000_000,
        eta: 3,
      });

      await expect(page.getByText("7.2 MB / 9.5 MB")).toBeVisible();
    });
  });
});
