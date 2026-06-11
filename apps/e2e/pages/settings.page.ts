import type { Locator, Page } from "@playwright/test";

export class SettingsPage {
  constructor(private readonly page: Page) {}

  title(): Locator {
    return this.page.getByRole("heading", { name: "Settings" });
  }

  saveButton(): Locator {
    return this.page.getByRole("button", { name: "Save Settings" });
  }
}
