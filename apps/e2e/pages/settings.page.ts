import type { Locator, Page } from "@playwright/test";

export class SettingsPage {
  constructor(private readonly page: Page) {}

  title(): Locator {
    return this.page.getByRole("heading", { name: "Settings", level: 2 });
  }

  titleInLocale(name: string): Locator {
    return this.page.getByRole("heading", { name, level: 2 });
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: "Save Settings" });
  }

  resetButton(): Locator {
    return this.page.getByRole("button", { name: "Reset to Defaults" });
  }

  savedToast(): Locator {
    return this.page.getByText("Settings saved", { exact: true }).first();
  }

  resetCompleteToast(): Locator {
    return this.page
      .getByText("Settings reset to defaults", { exact: true })
      .first();
  }

  savePathInput(): Locator {
    return this.card("Default Save Location").getByRole("textbox").first();
  }

  languageSelect(): Locator {
    return this.card("Language").getByRole("combobox");
  }

  engineOption(label: string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  themeModeButton(mode: "Light" | "Dark" | "System"): Locator {
    return this.card("Appearance").getByRole("button", { name: mode });
  }

  accentSwatch(name: string): Locator {
    return this.card("Appearance").getByTitle(name, { exact: true });
  }

  concurrentDownloadsSelect(): Locator {
    return this.card("Concurrent Downloads").getByRole("combobox");
  }

  ffmpegDownloadButton(): Locator {
    return this.page.getByRole("button", {
      name: "Download FFmpeg & FFprobe",
    });
  }

  ytdlpDownloadButton(): Locator {
    return this.page.getByRole("button", { name: "Download yt-dlp" });
  }

  ytdlpSection(): Locator {
    return this.card("yt-dlp");
  }

  private card(title: string): Locator {
    return this.page
      .locator("div.rounded-lg.border")
      .filter({
        has: this.page.getByRole("heading", { name: title, level: 3 }),
      })
      .first();
  }

  async selectConcurrentDownloads(count: number): Promise<void> {
    await this.concurrentDownloadsSelect().click();
    await this.page
      .getByRole("option", { name: String(count), exact: true })
      .click();
  }

  async selectLanguage(nativeName: string): Promise<void> {
    await this.languageSelect().click();
    // Radix select + i18n re-render can make the option "unstable"; listbox scope helps.
    await this.page
      .getByRole("listbox")
      .getByRole("option", { name: nativeName })
      .click({ force: true });
  }
}
