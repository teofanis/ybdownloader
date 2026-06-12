/**
 * Playwright fixture for unpacked Chrome extension tests (@extension).
 * Separate from desktop UI fixtures — no Wails mock, no Vite server.
 */
import { test as base } from "@playwright/test";
import type { BrowserContext, Page } from "@playwright/test";
import {
  launchExtensionContext,
  openExtensionPopup,
  resolveExtensionId,
} from "../helpers/extension-context";
import { ExtensionYouTubePage } from "../pages/extension-youtube.page";

type ExtensionFixtures = {
  extensionContext: BrowserContext;
  extensionId: string;
  popup: Page;
  youtube: Page;
  youtubeOverlay: ExtensionYouTubePage;
};

export const test = base.extend<ExtensionFixtures>({
  extensionContext: async ({}, use) => {
    const context = await launchExtensionContext();
    await use(context);
    await context.close();
  },

  extensionId: async ({ extensionContext }, use) => {
    await use(await resolveExtensionId(extensionContext));
  },

  popup: async ({ extensionContext, extensionId }, use) => {
    const page = await openExtensionPopup(extensionContext, extensionId);
    await use(page);
    await page.close();
  },

  youtube: async ({ extensionContext }, use) => {
    const page = await extensionContext.newPage();
    const overlay = new ExtensionYouTubePage(page);
    await overlay.gotoWatchPage();
    await use(page);
    await page.close();
  },

  youtubeOverlay: async ({ youtube }, use) => {
    await use(new ExtensionYouTubePage(youtube));
  },
});

export { expect } from "@playwright/test";
