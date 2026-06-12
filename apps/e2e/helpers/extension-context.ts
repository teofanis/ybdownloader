import { chromium, type BrowserContext, type Page } from "@playwright/test";
import { EXTENSION_BUILD_DIR } from "./extension-path";
import { extensionIdFromPath } from "./extension-id";

function extensionLaunchArgs(): string[] {
  const args = [
    `--disable-extensions-except=${EXTENSION_BUILD_DIR}`,
    `--load-extension=${EXTENSION_BUILD_DIR}`,
  ];
  if (process.env.CI) {
    args.push("--headless=new");
  }
  return args;
}

export async function launchExtensionContext(): Promise<BrowserContext> {
  return chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: process.env.CI ? true : false,
    args: extensionLaunchArgs(),
    ignoreDefaultArgs: ["--disable-component-extensions-with-background-pages"],
  });
}

async function popupLoads(
  context: BrowserContext,
  extensionId: string,
): Promise<boolean> {
  const page = await context.newPage();
  try {
    await page.goto(`chrome-extension://${extensionId}/popup.html`, {
      timeout: 5_000,
    });
    return await page
      .getByRole("heading", { name: "YBDownloader" })
      .isVisible({ timeout: 3_000 });
  } catch {
    return false;
  } finally {
    await page.close();
  }
}

/** Resolve the loaded extension's chrome-extension:// origin id. */
export async function resolveExtensionId(
  context: BrowserContext,
): Promise<string> {
  const candidates = new Set<string>();

  for (const worker of context.serviceWorkers()) {
    candidates.add(new URL(worker.url()).host);
  }

  try {
    const worker = await context.waitForEvent("serviceworker", {
      timeout: 3_000,
    });
    candidates.add(new URL(worker.url()).host);
  } catch {
    // Popup-only MV3 builds may not register a service worker.
  }

  const probe = await context.newPage();
  const client = await context.newCDPSession(probe);
  try {
    for (let attempt = 0; attempt < 20; attempt++) {
      const { targetInfos } = await client.send("Target.getTargets");
      for (const target of targetInfos ?? []) {
        if (
          typeof target.url === "string" &&
          target.url.startsWith("chrome-extension://")
        ) {
          candidates.add(new URL(target.url).host);
        }
      }
      if (candidates.size > 0) break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  } finally {
    await probe.close();
  }

  candidates.add(extensionIdFromPath(EXTENSION_BUILD_DIR));

  for (const id of candidates) {
    if (await popupLoads(context, id)) {
      return id;
    }
  }

  throw new Error(
    "Could not resolve extension id — is chrome-mv3-prod built and loadable?",
  );
}

export async function openExtensionPopup(
  context: BrowserContext,
  extensionId: string,
): Promise<Page> {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  return page;
}
