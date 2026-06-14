# YBDownloader

### 🚨 Legal Notice 🚨

This software is provided as a technical demonstration and is intended for use only with content that you own or have explicit rights to download, such as CC0 or Creative Commons–licensed media.
The author does not encourage, support, or condone the use of this software in violation of applicable laws or third-party terms of service.

[![Go](https://img.shields.io/badge/Go-1.26-00ADD8?logo=go&logoColor=white)](https://go.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![CI](https://github.com/teofanis/ybdownloader/actions/workflows/ci.yml/badge.svg)](https://github.com/teofanis/ybdownloader/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/teofanis/ybdownloader/graph/badge.svg?token=FDFRYKFUVW)](https://codecov.io/gh/teofanis/ybdownloader)
[![CodeQL](https://github.com/teofanis/ybdownloader/actions/workflows/github-code-scanning/codeql/badge.svg)](https://github.com/teofanis/ybdownloader/actions/workflows/github-code-scanning/codeql)
![GH Downloads](https://img.shields.io/github/downloads/teofanis/ybdownloader/total)
[![Latest Release](https://img.shields.io/github/v/release/teofanis/ybdownloader)](https://github.com/teofanis/ybdownloader/releases)

A desktop YouTube downloader built with [Wails](https://wails.io/) (Go + React).

<!-- TODO: Add screenshot here -->
<!-- ![App Screenshot](docs/screenshot.png) -->

## Why?

A few years back I built [ElectronYoutubeDownloader](https://github.com/teofanis/ElectronYoutubeDownloader) as a fun weekend project to mess around with Electron. It worked, but Electron apps are... chunky.

When I discovered Wails, I wanted to see what a native Go backend with a React frontend felt like. This is basically a rewrite of that project, but lighter, faster, and with some extra goodies I always wanted to add.

## Features

- **YouTube Downloads** - Paste a URL, pick a format, download
- **yt-dlp** - Default download engine ([yt-dlp](https://github.com/yt-dlp/yt-dlp)); auto-downloaded like FFmpeg; Deno auto-installed for YouTube signature solving; switch to legacy built-in or add extra flags in Settings
- **Multiple Formats** - MP3, M4A, MP4, WebM (H.264+AAC for MP4, AAC for audio)
- **Queue System** - Add multiple videos, download them in parallel
- **Browse & Search** - Search YouTube or check trending videos directly in the app
- **Standalone Converter** - Convert local media files using FFmpeg with pre-made presets
- **Auto FFmpeg** - Don't have FFmpeg? The app will download it for you
- **Auto Updates** - Startup notification, opt-in beta/pre-release channel, and in-app download from GitHub Releases
- **Themes** - Light/dark mode + accent color customization
- **Localization** - English, German, Spanish, French, Portuguese, Bulgarian, Greek
- **Cross-platform** - Linux, Windows, macOS

## Tech Stack

| Layer         | Tech                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Backend       | Go 1.26, [yt-dlp](https://github.com/yt-dlp/yt-dlp) (default), [kkdai/youtube](https://github.com/kkdai/youtube) (legacy) |
| Frontend      | React 19, TypeScript, Tailwind CSS, Zustand                                                                               |
| Framework     | [Wails v2](https://wails.io/)                                                                                             |
| UI Components | [shadcn/ui](https://ui.shadcn.com/)                                                                                       |

## Getting Started

### Prerequisites

- Go 1.26+
- Node.js 24+ and pnpm 11.5.3 (via [Corepack](https://nodejs.org/api/corepack.html); pinned in `packageManager`)
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

**Linux only:**

```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev

# Fedora
sudo dnf install gtk3-devel webkit2gtk4.1-devel
```

### Development

This repo is a **pnpm monorepo** (Turborepo). The desktop app lives in `apps/desktop`, the browser extension in `apps/extension`, the marketing site in `apps/web`, and shared packages in `packages/`.

**First clone** (from repo root):

```bash
git clone https://github.com/teofanis/ybdownloader.git
cd ybdownloader
./scripts/setup-dev.sh
```

That script runs `corepack enable` and `corepack pnpm install`. Corepack **downloads the pnpm version** pinned in `package.json` (`packageManager`: `pnpm@11.5.3`) on first install — you do not install pnpm globally.

**Daily dev** (after setup):

```bash
pnpm dev:desktop      # Wails desktop app (hot reload)
pnpm dev:extension    # Plasmo extension dev server
pnpm dev:web          # Marketing site (Astro, port 4321)
pnpm test             # Go + JS unit tests
pnpm e2e              # Playwright smoke tests (desktop UI + Wails mock)
pnpm audit            # Dependency security audit (high+)
```

If you already ran `corepack enable` on this machine, `pnpm install` is enough. The `preinstall` hook verifies the running pnpm matches `packageManager`.

> npm and yarn are blocked. If an old global pnpm shadows Corepack, use `corepack pnpm install` or `./scripts/setup-dev.sh`.

### Build

```bash
pnpm build                    # JS packages via Turbo (desktop UI + extension)
pnpm build:web                # Marketing site (apps/web/dist)
pnpm build:desktop-ui           # Desktop frontend only (apps/desktop/frontend/dist)
pnpm build:desktop              # Full Wails app for your platform (apps/desktop/build/bin/)
pnpm build:extension            # Extension default target (Chrome MV3)
pnpm build:extension:release 1.0.0   # Chrome + Firefox zips for ext-v* releases
```

| Script                    | Output                                                             |
| ------------------------- | ------------------------------------------------------------------ |
| `build:desktop`           | `apps/desktop/build/bin/`                                          |
| `build:extension`         | `apps/extension/build/chrome-mv3-prod/`                            |
| `build:extension:release` | `apps/extension/chrome-extension-*.zip`, `firefox-extension-*.zip` |

Desktop releases: push tag `v*`. Extension releases: push tag `ext-v*` (see `extension-release.yml`).

### Running Tests

```bash
pnpm test                              # Go (apps/desktop) + JS packages via Turbo
pnpm run test:go                       # Go only
pnpm test:coverage                     # Vitest coverage (desktop UI + shared)
pnpm e2e                               # Playwright (apps/e2e)
```

### Linting

Pre-commit hooks are set up via Husky. On commit, it runs:

- `gofmt` + `go vet` + `golangci-lint` for Go files
- `prettier` + `eslint` for TypeScript/React files

You can also run manually:

```bash
pnpm lint           # Go + all JS packages
pnpm run lint:go    # Go only
```

## Project Structure

```
.
├── apps/
│   ├── desktop/          # Wails app (Go backend + React UI)
│   │   ├── internal/     # Domain, infra, app bindings
│   │   └── frontend/     # Desktop UI (@ybdownload/desktop-ui)
│   ├── extension/        # Browser extension (@ybdownload/extension)
│   ├── web/              # Marketing site (@ybdownload/web)
│   └── e2e/              # Playwright E2E tests
├── packages/
│   ├── shared/           # URLs, formats, deep links, release helpers, markdown
│   └── ui/               # Shared React components (shadcn/ui)
├── pnpm-workspace.yaml
└── turbo.json
```

**Architecture diagrams (Mermaid):** [GitHub Wiki](https://github.com/teofanis/ybdownload/wiki) — source in [`docs/wiki/`](docs/wiki/).

## Roadmap (Ideas)

- [ ] Playlist support
- [ ] Library support (Online Sync or Backup)
- [ ] Social Sharing / Listening now support ?
- [ ] Share Playlists from local (tunneling ?)
- [ ] Would be fun to play with (Listen together with friends)
- [ ] Add an actual player + system tray ?
- [ ] Auto-organising library /songs - perhaps could also do categorizing etc (AI playtime ?)
- [ ] Download history / persistence
- [ ] Custom FFmpeg presets in converter
- [ ] Subtitle downloads
- [ ] More languages

PRs welcome if you want to tackle any of these.

## Support

If you find this useful:

- ⭐ Star the repo
- ☕ [Buy me a coffee](https://buymeacoffee.com/teofanis)
- 💰 [PayPal](https://www.paypal.com/paypalme/teofanis)
- 💖 [Thanks.dev](https://thanks.dev/u/gh/teofanis)
- 💜 [Sponsor on GitHub](https://github.com/sponsors/teofanis)

## Credits

- [Wails](https://wails.io/) - Great framework, makes Go + web UIs feel native
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) - Default download engine
- [kkdai/youtube](https://github.com/kkdai/youtube) - Legacy YouTube client library
- [shadcn/ui](https://ui.shadcn.com/) - Clean component library
- [FFmpeg](https://ffmpeg.org/) - The backbone of media conversion

## License

MIT - do whatever you want with it.

---

_This started as a playground project and still is one. If something breaks, open an issue!_
