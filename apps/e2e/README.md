# Desktop UI E2E tests

Playwright tests for the Wails desktop frontend. Today the app runs in a normal browser via Vite with Go/Wails bindings stubbed in `fixtures/wails-mock.ts`.

## Mocked vs real Wails

**What we do now:** UI E2E with a stateful in-browser mock. The mock holds a queue, returns plausible API responses, and fires `queue:updated` the same way the Go backend does. No binary, no yt-dlp, fast CI.

**What we want eventually:** Real E2E — `wails dev` or a built app, Playwright driving the actual webview, real bindings and (for some suites) real downloads against fixtures.

**Why mock first:** Most regressions are React state, routing, and form UX. Those are cheap to run on every PR. Real E2E is slower, flakier, and needs OS-specific CI runners; it belongs on nightly/release or a smaller “integration” project.

**Can we switch later?** Yes. Page objects and specs should not mention the mock. Only the boot path changes:

| Piece      | Mocked (now)                            | Real (later)                     |
| ---------- | --------------------------------------- | -------------------------------- |
| Server     | Vite on 5173                            | Wails asset server / webview URL |
| Boot       | `page.addInitScript(WAILS_MOCK_SCRIPT)` | Skip mock; launch app binary     |
| Backend    | `fixtures/wails-mock.ts`                | Go app                           |
| Assertions | Same roles, labels, page objects        | Same                             |

Add a second Playwright project (e.g. `real-wails`) when ready; keep `@smoke` on the mock project for PR speed, move selected flows to `@integration` on real Wails.

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

### Regression (desktop + extension on release)

**What:** All desktop Playwright specs (`tests/` except `tests/extension/`) plus extension specs when using `test:regression:all` / `pnpm e2e:regression`.

**When CI runs it:** Before any desktop release build — tag push `v*` or manual release workflow (`release.yml`). Extension CI runs `@extension` separately on PRs (`extension-ci.yml`).

**Put a test here:** You don't tag for regression. Desktop specs under `tests/smoke`, `tests/full`, etc. are included via `playwright test`. Extension specs live in `tests/extension/` and run via `playwright.extension.config.ts` (builds `chrome-mv3-prod` in global setup if missing).

---

## How to pick a tag

Ask these in order:

1. **Would a failure block merging?** → `@smoke`
2. **Is it slow, detailed, or testing a secondary screen?** → `@full`
3. **Extension on YouTube?** → `@extension` (loads `chrome-mv3-prod`, opens a real watch URL, asserts overlay FAB + format menu).

You can use extra tags for organisation (`@settings`, `@browse`, …) but CI only gates on `@smoke` and `@full` today.

| Tag                   | CI                                       |
| --------------------- | ---------------------------------------- |
| `@smoke`              | PR smoke workflow                        |
| `@full`               | Nightly                                  |
| `@extension`          | Extension CI                             |
| `@web`                | Web workflow (`web.yml`)                 |
| `test:regression:all` | Release regression (desktop + extension) |

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
pnpm e2e:regression   # desktop suite + extension (@extension); release gate
pnpm e2e:extension    # extension only (@extension)
pnpm e2e:web          # marketing site /app scroll + nav (mobile)
pnpm e2e:ui           # Playwright UI mode
```

From `apps/e2e`: same scripts without the `e2e:` prefix (`pnpm test:smoke`, etc.). Marketing site: `pnpm e2e:web` from repo root, or `pnpm test:web` / `pnpm e2e:web` inside `apps/e2e`.

Do **not** run `turbo run e2e:web` — use `pnpm e2e:web` at the repo root instead.

Vite starts on port 5173 automatically unless one is already running (local dev only).

### Marketing site (`@web`)

Playwright config: `playwright.web.config.ts`. Serves the Astro build on port 4321 (`astro preview`) and runs specs under `tests/web/`:

- `app-scroll.spec.ts` — mobile `/app` scroll + showcase nav (`Pixel 5`)
- `navigation.spec.ts` — header links, home CTAs, redirects, 404 (`Desktop Chrome`)

```bash
pnpm e2e:web          # builds apps/web if dist/ is missing, then runs @web specs
```

CI (`web.yml`) reuses the build artifact and sets `WEB_DIST_READY=1` to skip a second build.

---

## CI reports on GitHub

What you get today without extra setup:

| Output                   | Where to see it                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------- |
| **Pass/fail**            | Actions → workflow run → job summary                                                   |
| **Failure annotations**  | PR “Checks” tab (Playwright `github` reporter)                                         |
| **Per-test breakdown**   | Checks → **Playwright (e2e-smoke)** etc. (JUnit via `publish-unit-test-result-action`) |
| **Codecov test results** | JUnit with flag `e2e` (same as Go `backend` / Vitest `frontend`)                       |
| **HTML report**          | Actions → Artifacts → `e2e-smoke-report` (download zip, open `index.html` locally)     |
| **Traces / screenshots** | Artifacts → `e2e-smoke-test-results` (on failure)                                      |

GitHub does **not** render the Playwright HTML report inline — you download the artifact. Optional later: publish reports to GitHub Pages or Cloudflare (see `.todos/product-site.md`).

To require smoke before merge: repo **Settings → Branches → branch protection → required checks** → add **Playwright smoke** / **E2E Smoke**.

---

## Layout

```
fixtures/       # extended test + Wails mock (+ builder for overrides)
pages/          # page objects — prefer roles/labels from en.json
helpers/        # test data, queue fixtures, mock-runtime (emit events)
tests/smoke/    # @smoke specs
tests/...       # @full and other suites as we add them
```

Import `test` and `expect` from `fixtures/test.ts`, not `@playwright/test` directly, so the Wails mock is always injected.
