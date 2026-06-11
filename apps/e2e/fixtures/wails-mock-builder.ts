import { WAILS_MOCK_SCRIPT } from "./wails-mock";

export interface WailsMockOptions {
  queue?: unknown[];
  settings?: Record<string, unknown>;
  appVersion?: string;
  searchResults?: unknown[];
}

/**
 * Builds an init script with optional seed data for the stateful Wails mock.
 */
export function buildWailsMockScript(options: WailsMockOptions = {}): string {
  if (Object.keys(options).length === 0) {
    return WAILS_MOCK_SCRIPT;
  }

  const init = JSON.stringify(options);
  return `window.__E2E_WAILS_INIT__ = ${init};\n${WAILS_MOCK_SCRIPT}`;
}
