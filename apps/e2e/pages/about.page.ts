import type { Locator, Page } from "@playwright/test";

export class AboutPage {
  constructor(private readonly page: Page) {}

  appTitle(): Locator {
    return this.page.getByRole("heading", { name: "YBDownloader", level: 3 });
  }

  versionBadge(): Locator {
    return this.page
      .getByRole("tabpanel")
      .getByText("v0.0.0-e2e", { exact: true })
      .first();
  }

  checkForUpdatesButton(): Locator {
    return this.page.getByRole("button", { name: "Check for Updates" });
  }
}
