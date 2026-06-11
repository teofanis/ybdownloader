import type { Locator, Page } from "@playwright/test";

export class DownloadsPage {
  constructor(private readonly page: Page) {}

  urlInput(): Locator {
    return this.page.getByPlaceholder("Paste YouTube URL here...");
  }

  addButton(): Locator {
    return this.page.getByRole("button", { name: "Add" });
  }

  formatSelect(): Locator {
    return this.page.getByRole("combobox");
  }

  emptyQueueMessage(): Locator {
    return this.page.getByText("No downloads in queue");
  }

  validationError(): Locator {
    return this.page.getByText("Please enter a valid YouTube URL");
  }

  addedToQueueToast(): Locator {
    return this.page.getByText("Added to queue", { exact: true }).first();
  }

  startAllButton(): Locator {
    return this.page.getByRole("button", { name: "Start All" });
  }

  clearCompletedButton(): Locator {
    return this.page.getByRole("button", { name: "Clear Completed" });
  }

  queueItemTitle(title: string): Locator {
    return this.page.getByRole("heading", { level: 4, name: title });
  }

  queueItemCountLabel(count: number): Locator {
    const noun = count === 1 ? "item" : "items";
    return this.page.getByText(`${count} ${noun}`);
  }

  async selectFormat(label: "MP3" | "M4A" | "MP4"): Promise<void> {
    await this.formatSelect().click();
    await this.page.getByRole("option", { name: label }).click();
  }
}
