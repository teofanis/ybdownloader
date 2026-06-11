import { test, expect } from "../../fixtures/test";
import { TAB_NAMES } from "../../pages/app.page";
import { DownloadsPage } from "../../pages/downloads.page";

test.describe("App boot", { tag: "@smoke" }, () => {
  test("S01: app boots after settings load", async ({ app }) => {
    await app.goto();

    for (const name of TAB_NAMES) {
      await expect(app.tab(name)).toBeVisible();
    }
  });

  test("S02: default tab is Downloads", async ({ app, page }) => {
    await app.goto();

    const downloads = new DownloadsPage(page);
    await app.expectActiveTab("Downloads");
    await expect(downloads.urlInput()).toBeVisible();
    await expect(downloads.emptyQueueMessage()).toBeVisible();
  });

  test("S09: header renders app title", async ({ app }) => {
    await app.goto();

    await expect(app.headerTitle()).toBeVisible();
    await expect(app.headerSubtitle()).toBeVisible();
    await expect(app.activeDownloadBadge()).toHaveCount(0);
  });
});
