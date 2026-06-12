import { test, expect } from "../../fixtures/test";
import { VIDEO_SAMPLES } from "../../helpers/data";
import {
  SAMPLE_COMPLETED_ITEM,
  SAMPLE_QUEUE_ITEM,
} from "../../helpers/fixtures";
import { DownloadsPage } from "../../pages/downloads.page";

test.describe("Download queue", { tag: "@smoke" }, () => {
  test("D01: add to queue shows row and toast", async ({ app, page }) => {
    await app.goto();

    const downloads = new DownloadsPage(page);
    await downloads.urlInput().fill(VIDEO_SAMPLES.youtube.valid);
    await downloads.addButton().click();

    await expect(downloads.addedToQueueToast()).toBeVisible();
    await expect(downloads.queueItemTitle("E2E Added Video")).toBeVisible();
    await expect(downloads.startAllButton()).toBeEnabled();
  });

  test.describe("with seeded queue", () => {
    test.use({ wailsMock: { queue: [SAMPLE_QUEUE_ITEM] } });

    test("D02: queue renders item from mock", async ({ app, page }) => {
      await app.goto();

      const downloads = new DownloadsPage(page);
      await expect(downloads.queueItemTitle("E2E Sample Video")).toBeVisible();
      await expect(downloads.queueItemCountLabel(1)).toBeVisible();
      await expect(downloads.emptyQueueMessage()).toHaveCount(0);
    });

    test("D03: start all enabled with queued items", async ({ app, page }) => {
      await app.goto();

      const downloads = new DownloadsPage(page);
      await expect(downloads.startAllButton()).toBeVisible();
      await expect(downloads.startAllButton()).toBeEnabled();
    });
  });

  test("D04: format selector changes", async ({ app, page }) => {
    await app.goto();

    const downloads = new DownloadsPage(page);
    await downloads.selectFormat("MP4");
    await expect(downloads.formatSelect()).toContainText("MP4");

    await downloads.selectFormat("M4A");
    await expect(downloads.formatSelect()).toContainText("M4A");
  });

  test.describe("with completed item", () => {
    test.use({
      wailsMock: {
        queue: [SAMPLE_QUEUE_ITEM, SAMPLE_COMPLETED_ITEM],
      },
    });

    test("D05: clear completed removes finished rows", async ({
      app,
      page,
    }) => {
      await app.goto();

      const downloads = new DownloadsPage(page);
      await expect(downloads.queueItemTitle("E2E Sample Video")).toHaveCount(2);
      await expect(downloads.clearCompletedButton()).toBeVisible();

      await downloads.clearCompletedButton().click();

      await expect(downloads.queueItemTitle("E2E Sample Video")).toHaveCount(1);
      await expect(downloads.queueItemCountLabel(1)).toBeVisible();
    });
  });
});
