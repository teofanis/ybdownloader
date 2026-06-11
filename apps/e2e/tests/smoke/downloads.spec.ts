import { test, expect } from "../../fixtures/test";
import { VIDEO_SAMPLES } from "../../helpers/data";
import { DownloadsPage } from "../../pages/downloads.page";

test.describe("Downloads", { tag: "@smoke" }, () => {
  test("S05: URL input accepts a valid YouTube link", async ({ app, page }) => {
    await app.goto();

    const downloads = new DownloadsPage(page);
    await downloads.urlInput().fill(VIDEO_SAMPLES.youtube.valid);

    await expect(downloads.urlInput()).toHaveValue(VIDEO_SAMPLES.youtube.valid);
    await expect(downloads.addButton()).toBeEnabled();
  });

  test("S06: invalid URL shows validation on add", async ({ app, page }) => {
    await app.goto();

    const downloads = new DownloadsPage(page);
    await downloads.urlInput().fill(VIDEO_SAMPLES.youtube.invalid);
    await downloads.addButton().click();

    await expect(downloads.validationError()).toBeVisible();
  });

  test("S07: empty queue state", async ({ app, page }) => {
    await app.goto();

    const downloads = new DownloadsPage(page);
    await expect(downloads.emptyQueueMessage()).toBeVisible();
    await expect(
      page.getByText("Paste a YouTube URL above or import a text file"),
    ).toBeVisible();
  });
});
