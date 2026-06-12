import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

export type TabName =
  | "Downloads"
  | "Browse"
  | "Converter"
  | "Settings"
  | "About";

export const TAB_NAMES: TabName[] = [
  "Downloads",
  "Browse",
  "Converter",
  "Settings",
  "About",
];

/** German tab labels (de.json) — for i18n E2E. */
export const TAB_NAMES_DE = [
  "Downloads",
  "Durchsuchen",
  "Konverter",
  "Einstellungen",
  "Über",
] as const;

export class AppPage {
  constructor(readonly page: Page) {}

  async goto(options?: { tabs?: readonly string[] }): Promise<void> {
    await this.page.goto("/");
    await this.waitForReady(options?.tabs ?? TAB_NAMES);
  }

  async waitForReady(tabs: readonly string[] = TAB_NAMES): Promise<void> {
    for (const name of tabs) {
      await expect(this.page.getByRole("tab", { name })).toBeVisible();
    }
  }

  tab(name: TabName | string): Locator {
    return this.page.getByRole("tab", { name });
  }

  async openTab(name: TabName | string): Promise<void> {
    await this.tab(name).click();
  }

  async expectActiveTab(name: TabName): Promise<void> {
    await expect(this.tab(name)).toHaveAttribute("data-state", "active");
  }

  headerTitle(): Locator {
    return this.page.getByRole("heading", { level: 1, name: "YBDownloader" });
  }

  headerSubtitle(): Locator {
    return this.page
      .getByRole("banner")
      .getByText("YouTube Downloader", { exact: true });
  }

  activeDownloadBadge(): Locator {
    return this.page.getByText(/\d+ active downloads?/);
  }
}
