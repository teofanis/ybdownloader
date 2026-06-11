import { test, expect } from "../../fixtures/test";
import { getMockedSettings } from "../../helpers/mock-runtime";
import { SettingsPage } from "../../pages/settings.page";

test.describe("Settings", { tag: "@full" }, () => {
  test.beforeEach(async ({ app }) => {
    await app.goto();
    await app.openTab("Settings");
  });

  test("SET01: dirty state enables save", async ({ page }) => {
    const settings = new SettingsPage(page);
    await expect(settings.title()).toBeVisible();
    await expect(settings.saveButton()).toBeDisabled();

    await settings.savePathInput().fill("/tmp/e2e-downloads");
    await expect(settings.saveButton()).toBeEnabled();
  });

  test("SET02: save persists to mocked backend", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.selectConcurrentDownloads(4);
    await settings.saveButton().click();

    await expect(settings.savedToast()).toBeVisible();
    await expect(settings.saveButton()).toBeDisabled();

    const stored = await getMockedSettings(page);
    expect(stored.maxConcurrentDownloads).toBe(4);
  });

  test("SET03: reset restores defaults", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.savePathInput().fill("/tmp/changed");
    await expect(settings.saveButton()).toBeEnabled();

    await settings.resetButton().click();
    await expect(settings.resetCompleteToast()).toBeVisible();
    await expect(settings.saveButton()).toBeDisabled();
    await expect(settings.savePathInput()).toHaveValue("/tmp");
  });

  test("SET04: engine switch hides yt-dlp section", async ({ page }) => {
    const settings = new SettingsPage(page);
    await expect(settings.ytdlpSection()).toBeVisible();

    await settings.engineOption("Built-in (Legacy)").click();
    await expect(settings.ytdlpSection()).toHaveCount(0);
    await expect(settings.saveButton()).toBeEnabled();
  });

  test("SET05: dark theme mode applies class", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.themeModeButton("Dark").click();

    await expect
      .poll(async () =>
        page.evaluate(() =>
          document.documentElement.classList.contains("dark"),
        ),
      )
      .toBe(true);
  });

  test("SET06: accent swatch selection", async ({ page }) => {
    const settings = new SettingsPage(page);
    const blue = settings.accentSwatch("Blue");

    await blue.click();
    await expect(blue).toHaveClass(/ring-2/);
  });

  test("SET07: language combobox lists locales", async ({ page }) => {
    const settings = new SettingsPage(page);
    await settings.languageSelect().click();

    await expect(page.getByRole("option", { name: "Deutsch" })).toBeVisible();
    await expect(page.getByRole("option", { name: "Español" })).toBeVisible();
  });

  test("SET08: ffmpeg and yt-dlp download buttons when unavailable", async ({
    page,
  }) => {
    const settings = new SettingsPage(page);
    await expect(settings.ffmpegDownloadButton()).toBeVisible();
    await expect(settings.ytdlpDownloadButton()).toBeVisible();
  });
});
