import type { Page } from "@playwright/test";

declare global {
  interface Window {
    __E2E_WAILS__?: {
      emit: (event: string, data: unknown) => void;
      getQueue: () => unknown[];
      getSettings: () => Record<string, unknown>;
    };
  }
}

/** Emit a Wails runtime event into the in-browser mock (see fixtures/wails-mock.ts). */
export async function emitWailsEvent(
  page: Page,
  event: string,
  data: unknown,
): Promise<void> {
  await page.evaluate(
    ({ eventName, payload }) => {
      window.__E2E_WAILS__?.emit(eventName, payload);
    },
    { eventName: event, payload: data },
  );
}

export async function getMockedSettings(
  page: Page,
): Promise<Record<string, unknown>> {
  return page.evaluate(() => window.__E2E_WAILS__?.getSettings() ?? {});
}
