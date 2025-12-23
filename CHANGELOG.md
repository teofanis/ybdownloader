# Changelog

All notable changes to YBDownloader will be documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Browser extension with floating download button on YouTube watch pages
- Deep link support (`ybdownloader://`) for seamless browser-to-app integration
- Media trimming in the converter (set start/end points before conversion)
- Browse tab with YouTube search and trending videos
- Settings panel with theme customization, language selection, and log level control
- Auto-update checker with GitHub Releases integration
- Automatic FFmpeg download if not found on system
- Support for 7 languages: English, German, Spanish, French, Portuguese, Bulgarian, Greek

### Changed
- Complete rewrite from the original Electron-based version
- Now uses Wails (Go + React) instead of Electron
- New UI built with shadcn/ui components
- State management migrated to Zustand

### Fixed
- Various edge cases in download queue handling
- FFmpeg path detection on different platforms

---

## Release History

This project started as a rewrite of [ElectronYoutubeDownloader](https://github.com/teofanis/ElectronYoutubeDownloader). The first stable release is currently in development.

All releases can be found on the [releases page](https://github.com/teofanis/ybdownloader/releases).

See the [commit history](https://github.com/teofanis/ybdownloader/commits/main) for detailed changes.

