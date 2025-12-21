# YB Download

<!-- TODO: Add badges here -->
<!-- [![Go](https://img.shields.io/badge/Go-1.25-blue.svg)](https://go.dev/) -->
<!-- [![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE) -->
<!-- [![CI](https://github.com/YOUR_USERNAME/ybdownload/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/ybdownload/actions/workflows/ci.yml) -->

A desktop YouTube downloader built with [Wails](https://wails.io/) (Go + React).

<!-- TODO: Add screenshot here -->
<!-- ![App Screenshot](docs/screenshot.png) -->

## Why?

A few years back I built [ElectronYoutubeDownloader](https://github.com/teofanis/ElectronYoutubeDownloader) as a fun weekend project to mess around with Electron. It worked, but Electron apps are... chunky. 

When I discovered Wails, I wanted to see what a native Go backend with a React frontend felt like. This is basically a rewrite of that project, but lighter, faster, and with some extra goodies I always wanted to add.

## Features

- **YouTube Downloads** - Paste a URL, pick a format, download
- **Multiple Formats** - MP3, M4A, MP4
- **Queue System** - Add multiple videos, download them in parallel
- **Browse & Search** - Search YouTube or check trending videos directly in the app
- **Standalone Converter** - Convert local media files using FFmpeg (no YouTube involved) + pre-made presets
- **Auto FFmpeg** - Don't have FFmpeg? The app will download it for you
- **i18n** - English, German, Spanish, French, Portuguese, Bulgarian, Greek ...
- **Cross-platform** - Linux, Windows, macOS

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Go 1.25, [kkdai/youtube](https://github.com/kkdai/youtube) |
| Frontend | React, TypeScript, Tailwind, Zustand |
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
git clone https://github.com/teofanis/ybdownload.git
cd ybdownload

# Install frontend deps
cd frontend && npm install && cd ..

# Run in dev mode (hot reload)
wails dev
```

### Build

```bash
# Build for your current platform
wails build

# The binary will be in build/bin/
```

### Running Tests

```bash
# Go tests
go test ./...

# Frontend tests
cd frontend && npm test
```

## Project Structure

```
.
├── internal/
│   ├── app/          # Wails app entry point
│   ├── core/         # Domain models & interfaces
│   └── infra/        # Infrastructure (downloader, queue, settings, etc.)
├── frontend/
│   ├── src/
│   │   ├── features/ # Downloads, Settings, Browse, Converter tabs
│   │   ├── components/
│   │   ├── store/    # Zustand store
│   │   └── locales/  # i18n translations
│   └── wailsjs/      # Generated Go bindings
├── build/            # Build assets (icons, manifests)
└── scripts/          # Helper scripts
```

## Roadmap / Ideas

- [ ] Playlist support
- [ ] Download history / persistence
- [ ] Custom FFmpeg presets in converter
- [ ] Subtitle downloads
- [ ] Better error messages
- [ ] More languages

PRs welcome if you want to tackle any of these.

## Credits

- [Wails](https://wails.io/) - Amazing framework
- [kkdai/youtube](https://github.com/kkdai/youtube) - YouTube client
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful components
- [FFmpeg](https://ffmpeg.org/) - The backbone of media conversion

## License

MIT - do whatever you want with it.

---

*This started as a playground project and still is one. If something breaks, sorry!*
