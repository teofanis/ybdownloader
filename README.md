# YBDownloader

### 🚨 Legal Notice 🚨
This software is provided as a technical demonstration and is intended for use only with content that you own or have explicit rights to download, such as CC0 or Creative Commons–licensed media.
The author does not encourage, support, or condone the use of this software in violation of applicable laws or third-party terms of service.


[![Go](https://img.shields.io/badge/Go-1.25-00ADD8?logo=go&logoColor=white)](https://go.dev/)
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
- **Multiple Formats** - MP3, M4A, MP4, WebM
- **Queue System** - Add multiple videos, download them in parallel
- **Browse & Search** - Search YouTube or check trending videos directly in the app
- **Standalone Converter** - Convert local media files using FFmpeg with pre-made presets
- **Auto FFmpeg** - Don't have FFmpeg? The app will download it for you
- **Auto Updates** - Check for updates from within the app
- **Themes** - Light/dark mode + accent color customization
- **Localization** - English, German, Spanish, French, Portuguese, Bulgarian, Greek
- **Cross-platform** - Linux, Windows, macOS

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Go 1.25, [kkdai/youtube](https://github.com/kkdai/youtube) |
| Frontend | React 19, TypeScript, Tailwind CSS, Zustand |
| Framework | [Wails v2](https://wails.io/) |
| UI Components | [shadcn/ui](https://ui.shadcn.com/) |

## Getting Started

### Prerequisites

- Go 1.25+
- Node.js 20+
- Wails CLI: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`

**Linux only:**
```bash
# Ubuntu/Debian
sudo apt-get install libgtk-3-dev libwebkit2gtk-4.1-dev

# Fedora
sudo dnf install gtk3-devel webkit2gtk4.1-devel
```

### Development

```bash
# Clone the repo
git clone https://github.com/teofanis/ybdownloader.git
cd ybdownloader

# Install deps
npm install              # root (husky, lint-staged)
cd frontend && npm install && cd ..

# Run in dev mode (hot reload)
wails dev
```

### Build

```bash
# Build for your current platform
wails build

# The binary ends up in build/bin/
```

### Running Tests

```bash
# Go tests
go test ./...

# Frontend tests
cd frontend && npm test

# With coverage
go test -cover ./...
cd frontend && npm run test:coverage
```

### Linting

Pre-commit hooks are set up via Husky. On commit, it runs:
- `gofmt` + `go vet` + `golangci-lint` for Go files
- `prettier` + `eslint` for TypeScript/React files

You can also run manually:
```bash
npm run lint        # lint everything
npm run lint:go     # just Go
npm run lint:frontend  # just frontend
```

## Project Structure

```
.
├── internal/
│   ├── app/          # Wails app, bindings to frontend
│   ├── core/         # Domain models, interfaces, errors
│   └── infra/        # Downloader, queue, converter, settings, updater
├── frontend/
│   ├── src/
│   │   ├── features/ # Downloads, Settings, Browse, Converter, About
│   │   ├── components/
│   │   ├── store/    # Zustand store
│   │   └── locales/  # i18n translations
│   └── wailsjs/      # Generated Go bindings
├── build/            # Build assets (icons, manifests, entitlements)
└── scripts/          # Lint scripts
```

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
- [kkdai/youtube](https://github.com/kkdai/youtube) - YouTube client library
- [shadcn/ui](https://ui.shadcn.com/) - Clean component library
- [FFmpeg](https://ffmpeg.org/) - The backbone of media conversion

## License

MIT - do whatever you want with it.

---

*This started as a playground project and still is one. If something breaks, open an issue!*
