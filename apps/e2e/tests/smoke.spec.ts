import { test, expect } from "@playwright/test";
import { WAILS_MOCK_SCRIPT } from "../fixtures/wails-mock";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(WAILS_MOCK_SCRIPT);
});

test("desktop UI loads and shows main navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("tab", { name: "Downloads" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Settings" })).toBeVisible();
});

test("URL input accepts a valid YouTube link", async ({ page }) => {
  await page.goto("/");

  const input = page.getByPlaceholder("Paste YouTube URL here...");
  await input.fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

  await expect(input).toHaveValue(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  );
});
