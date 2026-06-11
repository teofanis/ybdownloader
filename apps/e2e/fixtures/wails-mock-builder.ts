import { WAILS_MOCK_SCRIPT } from "./wails-mock";

export interface WailsMockOptions {
  queue?: unknown[];
  settings?: Record<string, unknown>;
  appVersion?: string;
  searchResults?: unknown[];
}

/**
 * Builds an init script with optional overrides on top of the base Wails mock.
 */
export function buildWailsMockScript(options: WailsMockOptions = {}): string {
  const payload = JSON.stringify(options);

  return `
${WAILS_MOCK_SCRIPT}
(() => {
  const opts = ${payload};
  const app = window.go?.app?.App;
  if (!app) return;

  if (opts.queue !== undefined) {
    app.GetQueue = () => Promise.resolve(opts.queue);
  }

  if (opts.settings) {
    const previousGetSettings = app.GetSettings;
    app.GetSettings = () =>
      previousGetSettings().then((settings) => ({ ...settings, ...opts.settings }));
  }

  if (opts.appVersion) {
    app.GetAppVersion = () => Promise.resolve(opts.appVersion);
  }

  if (opts.searchResults) {
    const data = { results: opts.searchResults, query: "" };
    app.SearchYouTube = () => Promise.resolve(data);
    app.GetTrendingVideos = () => Promise.resolve(data);
  }
})();
`;
}
