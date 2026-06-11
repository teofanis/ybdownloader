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

export class AppPage {
  constructor(readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/");
    await this.waitForReady();
  }

  async waitForReady(): Promise<void> {
    for (const name of TAB_NAMES) {
      await expect(this.tab(name)).toBeVisible();
    }
  }

  tab(name: TabName): Locator {
    return this.page.getByRole("tab", { name });
  }

  async openTab(name: TabName): Promise<void> {
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
