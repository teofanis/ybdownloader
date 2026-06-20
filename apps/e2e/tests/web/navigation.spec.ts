import { test, expect } from "@playwright/test";
import { headerNavRoutes, homeHeroLinks } from "../../helpers/web-routes";

function headerNav(page: import("@playwright/test").Page) {
  return page.locator("header nav");
}

test.describe("marketing navigation", { tag: "@web" }, () => {
  test.describe("header nav", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    for (const route of headerNavRoutes) {
      test(`header link navigates to ${route.path}`, async ({ page }) => {
        await headerNav(page)
          .getByRole("link", { name: route.navLabel, exact: true })
          .click();

        await expect(page).toHaveURL(route.path);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
          route.heading,
        );
        await expect(page).toHaveTitle(route.pageTitle);
      });
    }

    test("logo returns to the homepage", async ({ page }) => {
      await page.goto("/download");
      await page.locator('header a[href="/"]').first().click();

      await expect(page).toHaveURL("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Fast YouTube downloads",
      );
    });
  });

  test("header Download button goes to the download page", async ({ page }) => {
    await page.goto("/");
    await page.locator("header a.rounded-full.bg-accent").click();

    await expect(page).toHaveURL("/download");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Desktop app",
    );
  });

  test.describe("home hero links", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    for (const link of homeHeroLinks) {
      test(`"${link.label}" navigates to ${link.path}`, async ({ page }) => {
        await page
          .locator("main")
          .getByRole("link", { name: link.label })
          .click();

        await expect(page).toHaveURL(link.path);
        await expect(page.getByRole("heading", { level: 1 })).toContainText(
          link.heading,
        );
      });
    }

    test("primary download CTA goes to the download page", async ({ page }) => {
      await page
        .locator("main")
        .getByRole("link", { name: /Download v/i })
        .click();

      await expect(page).toHaveURL("/download");
    });
  });

  test("/desktop redirects to /app", async ({ page }) => {
    await page.goto("/desktop");
    await expect(page).toHaveURL(/\/app$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Built for long sessions",
    );
  });

  test("unknown URLs show 404 with a path back home", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Page not found",
    );

    await page.getByRole("link", { name: "Go home" }).click();
    await expect(page).toHaveURL("/");
  });
});
