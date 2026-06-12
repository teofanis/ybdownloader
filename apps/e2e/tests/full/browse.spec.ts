import { test, expect } from "../../fixtures/test";
import {
  SAMPLE_SEARCH_RESULTS,
  SAMPLE_TRENDING_RESULTS,
} from "../../helpers/fixtures";
import { getMockedQueue } from "../../helpers/mock-runtime";
import { BrowsePage } from "../../pages/browse.page";

test.describe("Browse", { tag: "@full" }, () => {
  test.beforeEach(async ({ app }) => {
    await app.goto();
    await app.openTab("Browse");
  });

  test("B01: search disabled when empty", async ({ page }) => {
    const browse = new BrowsePage(page);
    await expect(browse.title()).toBeVisible();
    await expect(browse.searchButton()).toBeDisabled();
  });

  test("B02: search enabled with text", async ({ page }) => {
    const browse = new BrowsePage(page);
    await browse.searchInput().fill("e2e test query");
    await expect(browse.searchButton()).toBeEnabled();
  });

  test.describe("with mocked results", () => {
    test.use({
      wailsMock: {
        searchResults: [...SAMPLE_SEARCH_RESULTS],
        trendingResults: [...SAMPLE_TRENDING_RESULTS],
      },
    });

    test("B03: search results list from mock", async ({ page }) => {
      const browse = new BrowsePage(page);
      await browse.search("e2e");
      await expect(browse.videoTitle("E2E Search Video One")).toBeVisible();
      await expect(browse.videoTitle("E2E Search Video Two")).toBeVisible();
    });

    test("B04: trending tab shows different mock data", async ({ page }) => {
      const browse = new BrowsePage(page);
      await expect(browse.videoTitle("E2E Trending Hit")).toBeVisible();
      await expect(browse.trendingTab()).toHaveClass(/bg-primary/);

      await browse.searchResultsTab().click();
      await browse.search("e2e");
      await expect(browse.videoTitle("E2E Search Video One")).toBeVisible();
      await expect(browse.videoTitle("E2E Trending Hit")).toBeHidden();
    });

    test("B05: add to queue from card", async ({ page }) => {
      const browse = new BrowsePage(page);
      await browse.addVideoToQueue("E2E Trending Hit");
      await expect(browse.addedToQueueToast()).toBeVisible();

      const queue = await getMockedQueue(page);
      expect(queue).toHaveLength(1);
      expect(queue[0]).toMatchObject({
        url: SAMPLE_TRENDING_RESULTS[0].url,
        state: "queued",
      });
    });
  });
});
