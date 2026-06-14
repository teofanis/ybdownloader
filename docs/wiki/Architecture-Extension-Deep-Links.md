# Extension & deep links

Plasmo extension (`apps/extension`). Injects a download button on YouTube; clicking it fires a deep link that opens the desktop app and enqueues the video.

## Flow

```mermaid
flowchart LR
  YT[YouTube page] --> Ext[content script]
  Ext --> Link["ybdownloader://add?url=…"]
  Link --> OS[OS protocol handler]
  OS --> App[desktop app]
  App --> Queue[download queue]
```

## Deep link format

```
ybdownloader://add?url=ENCODED_URL&format=mp3
```

| Param    | Required | Values                                          |
| -------- | -------- | ----------------------------------------------- |
| `url`    | yes      | Encoded YouTube URL                             |
| `format` | no       | `mp3`, `mp4`, `webm` — defaults to app settings |

Built in `packages/shared/src/deep-link.ts`. Extension and desktop must stay in sync if you change this.

## Protocol registration

| OS      | How                                                    |
| ------- | ------------------------------------------------------ |
| Windows | Installer registers handler                            |
| macOS   | `OnUrlOpen` in Wails                                   |
| Linux   | AppImageLauncher, or `install-protocol.sh` for tarball |

Desktop side: `internal/app/app.go` (`handleDeepLink`, `OnSecondInstance`). Cold start on Win/Linux passes the URL via `os.Args`.

## Build & release

```bash
pnpm dev:extension                              # → build/chrome-mv3-dev
pnpm build:extension:release 1.0.0              # local zips
git tag ext-v1.0.0 && git push origin ext-v1.0.0  # CI release
```

Targets: Chrome MV3, Firefox. Details: [apps/extension/README](https://github.com/teofanis/ybdownloader/blob/main/apps/extension/README.md).

Sites: `youtube.com`, `music.youtube.com`.

Desktop app: [[Architecture-Desktop]]. CI: [[Architecture-Releases-and-CI]].
