import type { Locator, Page } from "@playwright/test";

export class DownloadsPage {
  constructor(private readonly page: Page) {}

  urlInput(): Locator {
    return this.page.getByPlaceholder("Paste YouTube URL here...");
  }

  addButton(): Locator {
    return this.page.getByRole("button", { name: "Add" });
  }

  emptyQueueMessage(): Locator {
    return this.page.getByText("No downloads in queue");
  }

  validationError(): Locator {
    return this.page.getByText("Please enter a valid YouTube URL");
  }
}
