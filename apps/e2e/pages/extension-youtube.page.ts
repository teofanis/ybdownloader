import type { Locator, Page } from "@playwright/test";
import { VIDEO_SAMPLES } from "../helpers/data";

export class ExtensionYouTubePage {
  constructor(private readonly page: Page) {}

  async gotoWatchPage(
    url: string = VIDEO_SAMPLES.youtube.valid,
  ): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    await this.dismissConsentIfPresent();
    await this.waitForWatchPageReady();
    await this.waitForOverlay();
  }

  private async waitForWatchPageReady(): Promise<void> {
    await this.page.waitForURL(/youtube\.com\/watch|music\.youtube\.com\/watch/, {
      timeout: 15_000,
    });
  }

  /** Plasmo content-script host; FAB renders inside its open shadow root. */
  async waitForOverlay(): Promise<void> {
    const timeout = process.env.CI ? 30_000 : 20_000;
    await this.page
      .locator("#ybd-overlay-host")
      .waitFor({ state: "attached", timeout });
    await this.downloadFab().waitFor({ state: "visible", timeout });
  }

  private async dismissConsentIfPresent(): Promise<void> {
    const accept = this.page.getByRole("button", {
      name: /accept all|agree|i agree|reject all/i,
    });
    if (await accept.first().isVisible({ timeout: 5_000 }).catch(() => false)) {
      await accept.first().click();
    }
  }

  downloadFab(): Locator {
    return this.page.getByRole("button", { name: "Download video" });
  }

  formatMenu(): Locator {
    return this.page.getByRole("menu", { name: "Download format" });
  }

  formatOption(label: "MP3" | "MP4" | "WebM"): Locator {
    return this.page.getByRole("menuitem", { name: new RegExp(label) });
  }

  async openFormatMenu(): Promise<void> {
    await this.downloadFab().click();
    await this.formatMenu().waitFor({ state: "visible" });
  }

  async selectFormat(label: "MP3" | "MP4" | "WebM"): Promise<void> {
    await this.formatOption(label).click();
  }
}
