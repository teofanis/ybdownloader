import type { Locator, Page } from "@playwright/test";

export class ConverterPage {
  constructor(private readonly page: Page) {}

  selectFileTitle(): Locator {
    return this.page.getByRole("heading", { name: "Select File" });
  }

  fileSelectButton(): Locator {
    return this.page.locator(".border-dashed").getByRole("button");
  }

  /** Initial empty-state label before a file is chosen. */
  browseFilesButton(): Locator {
    return this.page.getByRole("button", { name: "Browse files..." });
  }

  startConversionButton(): Locator {
    return this.page.getByRole("button", { name: "Start Conversion" });
  }

  emptyQueueMessage(): Locator {
    return this.page.getByText("No conversions yet");
  }

  categoryButton(name: string): Locator {
    return this.page.getByRole("button", { name });
  }

  presetButton(name: string): Locator {
    return this.page.getByRole("button", { name: new RegExp(name) });
  }

  jobProgressBar(): Locator {
    return this.page.getByRole("progressbar");
  }

  jobProgressText(percent: number): Locator {
    return this.page.getByText(`${percent}%`, { exact: true });
  }

  async expandCategory(name: string): Promise<void> {
    await this.categoryButton(name).click();
  }

  async selectPreset(name: string): Promise<void> {
    await this.presetButton(name).click();
  }

  async selectMediaFile(): Promise<void> {
    await this.fileSelectButton().click();
  }
}
