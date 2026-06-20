import { test, expect } from "@playwright/test";
import {
  readScrollY,
  scrollPastInlineShowcaseNav,
  waitForShowcaseNav,
} from "../../helpers/web-showcase";

test.describe("/app showcase nav", { tag: "@web" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/app");
    await waitForShowcaseNav(page);
  });

  test("float nav stays hidden at the top of the page", async ({ page }) => {
    await expect(page.locator("#showcase-nav-float")).toHaveAttribute(
      "data-visible",
      "false",
    );
  });

  test("float nav appears after scrolling past the inline nav", async ({
    page,
  }) => {
    await scrollPastInlineShowcaseNav(page);

    await expect(page.locator("#showcase-nav-float")).toHaveAttribute(
      "data-visible",
      "true",
    );
  });

  test("scrolling through the downloads section does not snap back up", async ({
    page,
  }) => {
    await page.locator("#downloads").scrollIntoViewIfNeeded();

    const scrollBefore = await readScrollY(page);
    await page.evaluate(() => window.scrollBy({ top: 500, behavior: "auto" }));

    await expect
      .poll(async () => readScrollY(page), { timeout: 3_000 })
      .toBeGreaterThan(scrollBefore + 200);

    const scrollAfter = await readScrollY(page);

    await expect
      .poll(async () => readScrollY(page), { timeout: 2_000 })
      .toBeGreaterThanOrEqual(scrollAfter - 20);
  });
});
