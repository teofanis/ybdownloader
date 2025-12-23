# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |
| < latest | :x:               |

Only the latest release receives security updates. If you're running an older version, please upgrade.

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not open a public issue.**

Instead, email the maintainer directly at: **teofanis@users.noreply.github.com**

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes (optional)

You should receive a response within 72 hours. If the issue is confirmed, a fix will be prioritized and released as soon as possible. You'll be credited in the release notes unless you prefer to remain anonymous.

## Scope

This policy covers the YBDownloader application itself. It does not cover:

- Third-party dependencies (report those to their respective maintainers)
- The YouTube platform or its terms of service
- FFmpeg (report to the FFmpeg project)

## Security Considerations

YBDownloader downloads and processes media files from the internet. A few things to keep in mind:

- **FFmpeg**: The app uses FFmpeg for media conversion. FFmpeg is a mature project with its own security track record. The app can auto-download FFmpeg binaries from official sources.

- **Network requests**: The app makes requests to YouTube and GitHub (for update checks). No data is sent to any other servers.

- **Local storage**: Settings and logs are stored locally in your user config directory. No cloud sync, no telemetry.

- **Deep links**: The app registers a custom URL scheme (`ybdownloader://`). This is used only for the browser extension integration.

## Updates

The app includes an update checker that fetches release info from GitHub. Updates are not installed automatically—you're prompted to download and install manually.

