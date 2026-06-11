import { test, expect } from "../../fixtures/test";
import { TAB_NAMES_DE } from "../../pages/app.page";
import { SettingsPage } from "../../pages/settings.page";

test.describe("Settings i18n", { tag: "@full" }, () => {
  test.use({ wailsMock: { settings: { language: "de" } } });

  test("SET07b: German settings from backend locale", async ({ app, page }) => {
    await app.goto({ tabs: TAB_NAMES_DE });
    await app.openTab("Einstellungen");

    const settings = new SettingsPage(page);
    await expect(settings.titleInLocale("Einstellungen")).toBeVisible();
  });
});
