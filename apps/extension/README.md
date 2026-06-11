# YBDownloader Browser Extension

A companion browser extension that adds a **Download** button to YouTube videos, allowing you to add them directly to your YBDownloader queue.

## Features

- 🎵 One-click download button on YouTube video pages
- 📦 Format selection (MP3, MP4, WebM)
- 🔗 Deep link integration with YBDownloader app
- ⚡ Instant queue additions without leaving YouTube
- 🎨 Matches YouTube's native UI style

## Development

This package lives in the monorepo at `apps/extension` (`@ybdownload/extension`). Install tooling once from the **repo root** — see the [root README](../../README.md).

```bash
# From repo root (first clone)
./scripts/setup-dev.sh

# Or, if Corepack is already enabled on your machine:
corepack enable
pnpm install

# Extension dev server (hot reload)
pnpm dev:extension
```

Load the extension in Chrome:

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `apps/extension/build/chrome-mv3-dev`

### Lint & build

```bash
# From repo root
pnpm --filter @ybdownload/extension lint
pnpm --filter @ybdownload/extension build
pnpm --filter @ybdownload/extension build -- --target=firefox-mv3
```

## Release Process

Extension releases are separate from the desktop app:

1. Bump version in `apps/extension/package.json`
2. Tag and push: `git tag ext-v1.0.0 && git push origin ext-v1.0.0`
3. GitHub Actions builds Chrome and Firefox artifacts (see `extension-release.yml`)

## Deep Link Format

```
ybdownloader://add?url=ENCODED_YOUTUBE_URL&format=FORMAT
```

| Parameter | Required | Values                                          |
| --------- | -------- | ----------------------------------------------- |
| `url`     | yes      | URL-encoded YouTube video URL                   |
| `format`  | no       | `mp3`, `mp4`, `webm` (defaults to app settings) |

## Supported Sites

- youtube.com / www.youtube.com
- music.youtube.com

## License

MIT — same as YBDownloader
