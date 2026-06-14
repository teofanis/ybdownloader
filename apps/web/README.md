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

## Deploy

CI is in `.github/workflows/web.yml`. It lints, builds, and deploys to Cloudflare Pages when the secrets are set.

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

- `WEB_SITE_URL` — used in `astro.config` (defaults to `https://ybdownloader.pages.dev`)
- `CF_PAGES_PROJECT` — defaults to `ybdownload`

### Deploy from your machine

```bash
pnpm build:web
pnpm --filter @ybdownload/web deploy:pages
```

Config: `wrangler.jsonc` (Wrangler 4).
