# YBDownloader Browser Extension

A companion browser extension that adds a **Download** button to YouTube videos, allowing you to add them directly to your YBDownloader queue.

## Features

- 🎵 One-click download button on YouTube video pages
- 📦 Format selection (MP3, MP4, WebM)
- 🔗 Deep link integration with YBDownloader app
- ⚡ Instant queue additions without leaving YouTube
- 🎨 Matches YouTube's native UI style

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
cd browser-extension
npm install
```

### Development Server

```bash
npm run dev
```

Then load the extension in Chrome:

1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-dev` folder

### Linting

```bash
npm run lint      # Check TypeScript + Prettier
npm run format    # Fix Prettier issues
```

### Production Build

```bash
npm run build              # Build for Chrome
npm run build -- --target=firefox-mv3  # Build for Firefox
npm run package            # Create distributable zip
```

## Release Process

Extension releases are separate from the main app. To release:

1. Update version in `package.json`
2. Create and push a tag: `git tag ext-v1.0.0 && git push origin ext-v1.0.0`
3. GitHub Actions will build and create a release

The release workflow:

- Builds for Chrome (MV3) and Firefox (MV3)
- Creates zip files for manual installation
- Creates a GitHub release with installation instructions

## Deep Link Format

```
ybdownloader://add?url=ENCODED_YOUTUBE_URL&format=FORMAT
```

**Parameters:**

- `url` (required): URL-encoded YouTube video URL
- `format` (optional): `mp3`, `mp4`, or `webm` (defaults to app settings)

## Supported Sites

- youtube.com
- www.youtube.com
- music.youtube.com

## CI/CD

- **extension-ci.yml**: Runs on pushes/PRs that modify `browser-extension/`
  - TypeScript check
  - Prettier check
  - Build verification
- **extension-release.yml**: Runs on `ext-v*` tags
  - Builds Chrome and Firefox extensions
  - Creates GitHub release with artifacts

## License

MIT License - Same as YBDownloader
