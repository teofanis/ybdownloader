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

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: PAGES,
      numberOfRuns: 3,
      settings: MOBILE_SETTINGS,
    },
    assert: {
      // Lab scores are stricter than field CWV; thresholds target mobile CWV headroom.
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.92 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 3500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 400 }],
        // Static marketing site — not a PWA.
        "installable-manifest": "off",
        "service-worker": "off",
        "maskable-icon": "off",
        "splash-screen": "off",
        "themed-omnibox": "off",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
