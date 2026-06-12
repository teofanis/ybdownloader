/**
 * Extended Playwright test with Wails mock + AppPage fixture.
 * See apps/e2e/README.md for smoke / full / regression tiers and tagging.
 */
import { test as base, expect } from "@playwright/test";
import { AppPage } from "../pages/app.page";
import { buildWailsMockScript } from "./wails-mock-builder";
import type { WailsMockOptions } from "./wails-mock-builder";
import { WAILS_MOCK_SCRIPT } from "./wails-mock";

type Fixtures = {
  app: AppPage;
  wailsMock: WailsMockOptions;
};

export const test = base.extend<Fixtures>({
  wailsMock: [{}, { option: true }],

  app: async ({ page, wailsMock }, use) => {
    const script =
      Object.keys(wailsMock).length > 0
        ? buildWailsMockScript(wailsMock)
        : WAILS_MOCK_SCRIPT;

    await page.addInitScript(script);
    await use(new AppPage(page));
  },
});

export { expect };
