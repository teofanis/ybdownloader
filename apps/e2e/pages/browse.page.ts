import type { Locator, Page } from "@playwright/test";

export class BrowsePage {
  constructor(private readonly page: Page) {}

  title(): Locator {
    return this.page.getByRole("heading", { name: "Browse YouTube" });
  }

  searchInput(): Locator {
    return this.page.getByPlaceholder(
      "Search for videos, channels, playlists...",
    );
  }
}
