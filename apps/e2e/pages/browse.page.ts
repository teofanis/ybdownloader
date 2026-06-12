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

  searchButton(): Locator {
    return this.page.getByRole("button", { name: "Search", exact: true });
  }

  searchResultsTab(): Locator {
    return this.page.getByRole("button", { name: "Search Results" });
  }

  trendingTab(): Locator {
    return this.page.getByRole("button", { name: "Trending" });
  }

  videoTitle(title: string): Locator {
    return this.page.getByRole("heading", { level: 4, name: title });
  }

  addedToQueueToast(): Locator {
    return this.page.getByText("Added to queue", { exact: true }).first();
  }

  private videoCard(title: string): Locator {
    return this.page.locator(".group").filter({ has: this.videoTitle(title) });
  }

  async search(query: string): Promise<void> {
    await this.searchInput().fill(query);
    await this.searchButton().click();
  }

  async addVideoToQueue(title: string): Promise<void> {
    const card = this.videoCard(title);
    await card.hover();
    await card.getByRole("button").first().click();
  }
}
