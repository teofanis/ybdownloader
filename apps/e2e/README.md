# Desktop UI E2E tests

Playwright tests for the Wails desktop frontend. The app runs in a normal browser via Vite; Go/Wails bindings are stubbed in `fixtures/wails-mock.ts` so we can test the React UI without a real backend.

## Test tiers: smoke, full, regression

We split tests into three tiers. The tier decides **when CI runs them**, not how you write them (same fixtures, page objects, and mocks everywhere).

### Smoke (`@smoke`)

**What:** A small set of checks that prove the app basically works — it loads, tabs switch, core controls are there, obvious breakage is caught early.

**When CI runs it:** Every PR and push to `main` / `develop` that touches desktop UI, e2e, or shared UI packages (see `.github/workflows/e2e.yml`). Should finish in a couple of minutes.

**Put a test here if:**

- It covers a critical path most users hit (downloads tab, navigation, URL input).
- It's fast and stable — no long waits, no flaky timing.
- A failure means "we probably shouldn't merge this."

**Folder:** `tests/smoke/` (convention, not enforced by Playwright).

### Full (`@full`)

**What:** Deeper coverage — settings forms, browse search flows, converter, theme/i18n, Wails event wiring, anything that needs more setup or runs a longer scenario.

**When CI runs it:** Nightly at 02:00 UTC, plus you can trigger **E2E Nightly** manually from GitHub Actions. Locally: `pnpm e2e:nightly` (runs `@smoke` and `@full`; smoke is included until we have enough `@full`-only tests to stand alone).

**Put a test here if:**

- It takes noticeably longer than a smoke test, or needs a richer mock (`wailsMock` overrides).
- It exercises one feature thoroughly (save settings, search results, queue with items).
- It's still desktop UI with the Wails mock — not extension/browser tests.

**Folder:** `tests/downloads/`, `tests/settings/`, `tests/browse/`, etc. (create as we add suites).

### Regression (no tag — everything)

**What:** The entire Playwright suite in this package. Today that's the same as smoke; as we add `@full` tests, regression grows automatically.

**When CI runs it:** Before any desktop release build — tag push `v*` or manual release workflow. If regression fails, Linux/Windows/macOS builds do not start.

**Put a test here:** You don't tag for regression. Any spec file under `tests/` is included. Tag it `@smoke` or `@full` for the other tiers; regression always runs `playwright test` with no filter.

---

## How to pick a tag

Ask these in order:

1. **Would a failure block merging?** → `@smoke`
2. **Is it slow, detailed, or testing a secondary screen?** → `@full`
3. **Extension or real browser install?** → not yet; reserve `@extension` for later, out of this package.

You can use extra tags for organisation (`@settings`, `@browse`, …) but CI only gates on `@smoke` and `@full` today.

| Tag                    | CI                 |
| ---------------------- | ------------------ |
| `@smoke`               | PR smoke workflow  |
| `@full`                | Nightly            |
| (any file in `tests/`) | Release regression |

**Examples**

```ts
// PR gate — app must boot
test.describe("App boot", { tag: "@smoke" }, () => { ... });

// Nightly — saving settings, mocked backend
test.describe("Settings save", { tag: "@full" }, () => { ... });

// Both smoke and full (optional; usually pick one)
test.describe("Queue add", { tag: ["@smoke", "@full"] }, () => { ... });
```

When in doubt: start with `@full`. Move to `@smoke` once the test is stable and you care about it on every PR.

---

## Running locally

From the repo root:

```bash
pnpm e2e:smoke        # what PR CI runs
pnpm e2e:nightly      # smoke + full
pnpm e2e:full         # @full only
pnpm e2e:regression   # entire suite (release gate)
pnpm e2e:ui           # Playwright UI mode
```

From `apps/e2e`: same scripts without the `e2e:` prefix (`pnpm test:smoke`, etc.).

Vite starts on port 5173 automatically unless one is already running (local dev only).

---

## Layout

```
fixtures/       # extended test + Wails mock (+ builder for overrides)
pages/          # page objects — prefer roles/labels from en.json
helpers/        # shared test data (e.g. sample video URLs)
tests/smoke/    # @smoke specs
tests/...       # @full and other suites as we add them
```

Import `test` and `expect` from `fixtures/test.ts`, not `@playwright/test` directly, so the Wails mock is always injected.
