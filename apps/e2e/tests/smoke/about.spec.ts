import { test, expect } from "../../fixtures/test";
import { AboutPage } from "../../pages/about.page";

test.describe("About", { tag: "@smoke" }, () => {
  test("S08: about shows mocked app version", async ({ app, page }) => {
    await app.goto();
    await app.openTab("About");

    const about = new AboutPage(page);
    await expect(about.versionBadge()).toBeVisible();
    await expect(about.checkForUpdatesButton()).toBeEnabled();
  });
});
