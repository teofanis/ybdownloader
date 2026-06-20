import type { Page } from "@playwright/test";

export async function waitForShowcaseNav(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const anchor = document.getElementById("showcase-nav-anchor");
    const floater = document.getElementById("showcase-nav-float");
    return Boolean(anchor && floater);
  });
}

export async function scrollPastInlineShowcaseNav(page: Page): Promise<void> {
  await page.evaluate(() => {
    const anchor = document.getElementById("showcase-nav-anchor");
    if (!anchor) throw new Error("showcase-nav-anchor missing");

    const header = document.querySelector("header");
    const headerHeight = header
      ? Math.ceil(header.getBoundingClientRect().height)
      : 72;
    const anchorBottom = anchor.getBoundingClientRect().bottom + window.scrollY;

    window.scrollTo({ top: anchorBottom - headerHeight + 1, behavior: "auto" });
  });
}

export async function readScrollY(page: Page): Promise<number> {
  return page.evaluate(() => window.scrollY);
}
