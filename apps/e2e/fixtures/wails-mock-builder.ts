import { WAILS_MOCK_SCRIPT } from "./wails-mock";

export interface WailsMockUpdateInfo {
  status?: string;
  currentVersion?: string;
  latestVersion?: string;
  releaseNotes?: string;
  releaseUrl?: string;
  downloadUrl?: string;
  downloadSize?: number;
  progress?: number;
  prerelease?: boolean;
}

export interface WailsMockOptions {
  queue?: unknown[];
  settings?: Record<string, unknown>;
  appVersion?: string;
  searchResults?: unknown[];
  trendingResults?: unknown[];
  conversionPresets?: unknown[];
  conversionJobs?: unknown[];
  mediaFile?: string;
  mediaInfo?: Record<string, unknown>;
  /** CheckForUpdate response when updateChannel is stable (default). */
  checkForUpdate?: WailsMockUpdateInfo;
  /** CheckForUpdate response when updateChannel is beta. */
  checkForUpdateBeta?: WailsMockUpdateInfo;
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
