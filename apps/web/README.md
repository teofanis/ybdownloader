# Web

Marketing site for YBDownloader. Astro + Tailwind, package name `@ybdownload/web`.

## Routes

- `/` — home
- `/download` — desktop installers
- `/extension` — browser extension zips
- `/changelog` — release notes
- `/releases` — stable desktop releases and a separate pre-releases section (extension zips use `ext-v*` tags)
- `/docs` — links into the main repo

Versions and download URLs come from the GitHub Releases API when you build. Desktop tags (`v*`) are filtered from extension tags (`ext-v*`). The home and download pages use the latest **stable** desktop release only. If the fetch fails, pages still link out to GitHub Releases.

`public/live.json` is generated at build/dev start with star count and the latest desktop version. HTML keeps those values as no-JS fallbacks; a small client script refreshes them from `/live.json` using CDN stale-while-revalidate caching. Changelog and releases pages are still fully static and refresh on deploy (especially when a GitHub Release is published).

Cache headers live in `public/_headers` (copied to `dist/` on build). Cloudflare Pages applies them automatically on deploy — no dashboard setup required. After deploy, check with:

```bash
curl -sI https://ybdownload.pages.dev/ | grep -i cache-control
curl -sI https://ybdownload.pages.dev/live.json | grep -i cache-control
```

Turn off **Development Mode** in the Cloudflare dashboard if responses show `cf-cache-status: BYPASS`. Avoid Cache Rules that override `Cache-Control` for this project unless intentional.

## Local dev

From the repo root (first clone: run `./scripts/setup-dev.sh` instead of bare `pnpm install`):

```bash
./scripts/setup-dev.sh   # first time only
pnpm dev:web
```

http://localhost:4321

## Lint / format

```bash
pnpm --filter @ybdownload/web lint
pnpm --filter @ybdownload/web format
```

`lint` runs `astro check` and Prettier.

## Build

```bash
pnpm build:web
```

Output goes to `apps/web/dist/`.

## Test

Unit tests (Vitest):

```bash
pnpm --filter @ybdownload/web test
```

E2E (Playwright — navigation, `/app` scroll/nav). From repo root; builds the site first if `dist/` is missing:

```bash
pnpm e2e:web
```

Production smoke (same specs, live URL): `PLAYWRIGHT_BASE_URL=https://ybdownload.pages.dev pnpm e2e:web:live` — also runs nightly in `e2e-nightly.yml`.

From `apps/e2e`: `pnpm test:web` or `pnpm e2e:web` (after `pnpm build:web` or set `WEB_DIST_READY=1` if `dist/` exists).

Do **not** use `turbo run e2e:web` — that script is root `package.json` only, not a Turbo task.

### Lighthouse (mobile CWV lab checks)

Runs on PRs against the **built `dist/`** (same artifact as E2E) — not the Cloudflare preview. Lab Lighthouse is repeatable; preview adds CDN/cache noise that makes thresholds flaky.

```bash
pnpm build:web
pnpm lighthouse:web
```

Config: `lighthouserc.cjs`. Pages: `/`, `/app`, `/download`. Mobile emulation, 3 runs median.

| Metric / category | PR gate      |
| ----------------- | ------------ |
| LCP               | error ≤ 3.5s |
| CLS               | error ≤ 0.1  |
| TBT               | warn ≤ 400ms |
| Performance score | warn ≥ 85    |
| Accessibility     | error ≥ 92   |

Reports upload as CI artifact `lighthouse-report`. Nightly production checks stay on Playwright (`e2e-web-live`); add Lighthouse vs production later if you want CDN-specific monitoring.

## Deploy

CI is in `.github/workflows/web.yml`. It lints, unit-tests, builds, runs Playwright + Lighthouse, then deploys to Cloudflare Pages when the secrets are set.

- PRs that touch `apps/web/` → preview deploy (URL posted on the PR)
- `main` → production
- publishing a GitHub Release → production rebuild (picks up new tags/assets)
- `develop` → build only, no deploy
- `workflow_dispatch` → production, handy for a manual refresh

If the Cloudflare secrets are missing, lint/build still run and deploy logs a warning and skips.

Set repo variable `WEB_DEPLOY_ENABLED=false` to turn off all deploys (lint/build keep running).

### First-time Cloudflare setup

1. Create a Pages project called `ybdownload` (or set the `CF_PAGES_PROJECT` repo variable).
2. Turn off Cloudflare's own Git integration for this repo if you're deploying from Actions — otherwise you'll deploy twice.
3. Add secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

Optional repo variables:

- `WEB_SITE_URL` — used in `astro.config` (defaults to `https://ybdownload.pages.dev`)
- `CF_PAGES_PROJECT` — defaults to `ybdownload`

### Deploy from your machine

```bash
pnpm build:web
pnpm --filter @ybdownload/web deploy:pages
```

Config: `wrangler.jsonc` (Wrangler 4).
