import type { Locator, Page } from "@playwright/test";
import { VIDEO_SAMPLES } from "../helpers/data";

export class ExtensionYouTubePage {
  constructor(private readonly page: Page) {}

  async gotoWatchPage(
    url: string = VIDEO_SAMPLES.youtube.valid,
  ): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    await this.dismissConsentIfPresent();
  }

  private async dismissConsentIfPresent(): Promise<void> {
    const accept = this.page.getByRole("button", {
      name: /accept all|agree|i agree/i,
    });
    if (await accept.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await accept.click();
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
