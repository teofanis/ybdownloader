import type { Locator, Page } from "@playwright/test";

export class ConverterPage {
  constructor(private readonly page: Page) {}

  selectFileTitle(): Locator {
    return this.page.getByText("Select File");
  }

  browseFilesButton(): Locator {
    return this.page.getByRole("button", { name: "Browse files..." });
  }
}
