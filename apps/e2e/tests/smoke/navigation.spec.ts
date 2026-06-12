import { test, expect } from "../../fixtures/test";
import { TAB_NAMES, type TabName } from "../../pages/app.page";
import { BrowsePage } from "../../pages/browse.page";
import { ConverterPage } from "../../pages/converter.page";
import { DownloadsPage } from "../../pages/downloads.page";
import { SettingsPage } from "../../pages/settings.page";
import { AboutPage } from "../../pages/about.page";

const TAB_CONTENT: Record<
  TabName,
  (page: import("@playwright/test").Page) => Promise<void>
> = {
  Downloads: async (page) => {
    const downloads = new DownloadsPage(page);
    await expect(downloads.emptyQueueMessage()).toBeVisible();
  },
  Browse: async (page) => {
    const browse = new BrowsePage(page);
    await expect(browse.title()).toBeVisible();
    await expect(browse.searchInput()).toBeVisible();
  },
  Converter: async (page) => {
    const converter = new ConverterPage(page);
    await expect(converter.selectFileTitle()).toBeVisible();
    await expect(converter.browseFilesButton()).toBeVisible();
  },
  Settings: async (page) => {
    const settings = new SettingsPage(page);
    await expect(settings.title()).toBeVisible();
    await expect(settings.saveButton()).toBeVisible();
  },
  About: async (page) => {
    const about = new AboutPage(page);
    await expect(about.checkForUpdatesButton()).toBeVisible();
    await expect(about.versionBadge()).toBeVisible();
  },
};

test.describe("Navigation", { tag: "@smoke" }, () => {
  test("S03: each tab shows unique content", async ({ app, page }) => {
    await app.goto();

    for (const name of TAB_NAMES) {
      await app.openTab(name);
      await app.expectActiveTab(name);
      await TAB_CONTENT[name](page);
    }
  });

  test("S04: active tab highlight follows selection", async ({ app }) => {
    await app.goto();

    for (const name of TAB_NAMES) {
      await app.openTab(name);
      await app.expectActiveTab(name);

      for (const other of TAB_NAMES) {
        if (other === name) continue;
        await expect(app.tab(other)).not.toHaveAttribute(
          "data-state",
          "active",
        );
      }
    }
  });
});
