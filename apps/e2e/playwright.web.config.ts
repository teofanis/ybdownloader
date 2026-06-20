import { defineConfig, devices } from "@playwright/test";

const PORT = 4321;
const localBaseURL = `http://127.0.0.1:${PORT}`;
const liveBaseURL = process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, "");
const baseURL = liveBaseURL ?? localBaseURL;
const useLiveSite = Boolean(liveBaseURL);

const previewCommand =
  "pnpm --filter @ybdownload/web exec astro preview --host 127.0.0.1 --port 4321";

const webServerCommand = process.env.WEB_DIST_READY
  ? previewCommand
  : `pnpm --filter @ybdownload/web build && ${previewCommand}`;

export default defineConfig({
  testDir: "./tests/web",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [
        ["github"],
        ["html", { open: "never", outputFolder: "playwright-report" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ]
    : [["list"], ["html", { open: "on-failure" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-chrome",
      testMatch: "**/app-scroll.spec.ts",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "desktop-chrome",
      testMatch: "**/navigation.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  ...(useLiveSite
    ? {}
    : {
        webServer: {
          command: webServerCommand,
          url: localBaseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
        },
      }),
});
