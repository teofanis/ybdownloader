/** @type {import('@lhci/cli/src/index').LHCI.ServerCommand.Options} */
const MOBILE_SETTINGS = {
  formFactor: "mobile",
  screenEmulation: {
    mobile: true,
    width: 412,
    height: 823,
    deviceScaleFactor: 2.625,
    disabled: false,
  },
  throttling: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
  },
};

/** Core marketing routes — keep small for fast PR feedback. */
const PAGES = ["/", "/app", "/download"];

const PR_ASSERTIONS = {
  "categories:performance": ["warn", { minScore: 0.85 }],
  "categories:accessibility": ["error", { minScore: 0.92 }],
  "categories:best-practices": ["warn", { minScore: 0.9 }],
  "largest-contentful-paint": ["error", { maxNumericValue: 3500 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
  "total-blocking-time": ["warn", { maxNumericValue: 400 }],
  "installable-manifest": "off",
  "service-worker": "off",
  "maskable-icon": "off",
  "splash-screen": "off",
  "themed-omnibox": "off",
};

/** Nightly production — warn only (CDN / field variance). */
const LIVE_ASSERTIONS = {
  "categories:performance": ["warn", { minScore: 0.8 }],
  "categories:accessibility": ["warn", { minScore: 0.9 }],
  "categories:best-practices": ["warn", { minScore: 0.85 }],
  "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
  "cumulative-layout-shift": ["warn", { maxNumericValue: 0.15 }],
  "total-blocking-time": ["warn", { maxNumericValue: 500 }],
  "installable-manifest": "off",
  "service-worker": "off",
  "maskable-icon": "off",
  "splash-screen": "off",
  "themed-omnibox": "off",
};

const liveBase = process.env.LIGHTHOUSE_BASE_URL?.replace(/\/$/, "");
const isLive = Boolean(liveBase);

module.exports = {
  ci: {
    collect: {
      ...(isLive
        ? { url: PAGES.map((page) => `${liveBase}${page}`) }
        : { staticDistDir: "./dist", url: PAGES }),
      numberOfRuns: isLive ? 1 : 3,
      settings: MOBILE_SETTINGS,
    },
    assert: {
      assertions: isLive ? LIVE_ASSERTIONS : PR_ASSERTIONS,
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
