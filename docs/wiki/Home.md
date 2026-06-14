# Developer wiki

How the repo fits together — data flow, deploys, and where to look when you change something.

Diagrams are Mermaid (render on GitHub Wiki and in the IDE).

## Pages

| Page                                  | Read this when…                                       |
| ------------------------------------- | ----------------------------------------------------- |
| [[Architecture-Monorepo]]             | You're new to the repo or need the big picture        |
| [[Architecture-Web]]                  | You touch the marketing site, caching, or `live.json` |
| [[Architecture-Desktop]]              | You work on the Wails app, queue, or downloads        |
| [[Architecture-Desktop-Updates]]      | You change in-app updates or release channels         |
| [[Architecture-Extension-Deep-Links]] | You work on the extension or `ybdownloader://` links  |
| [[Architecture-Releases-and-CI]]      | You cut a release or debug CI                         |

## What lives where

| Location                                                                                  | Purpose                                                  |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **`docs/wiki/`** (this wiki)                                                              | Architecture — update when behaviour or pipelines change |
| **`apps/*/README.md`**                                                                    | Commands for that app (build, dev, deploy)               |
| **[README.md](https://github.com/teofanis/ybdownloader/blob/main/README.md)**             | User-facing intro and getting started                    |
| **[CONTRIBUTING.md](https://github.com/teofanis/ybdownloader/blob/main/CONTRIBUTING.md)** | PRs, branches, local setup                               |

Don't duplicate build commands here — they drift. Link to the app README instead.

## Keeping docs in sync

| You changed…                              | Update…                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------- |
| Web caching, `live.json`, deploy          | [[Architecture-Web]] + `apps/web/README.md`                                |
| Desktop queue, downloader, Wails bindings | [[Architecture-Desktop]]                                                   |
| Updater or channel logic                  | [[Architecture-Desktop-Updates]] + `packages/shared/src/releases.ts`       |
| Extension UI or deep link format          | [[Architecture-Extension-Deep-Links]] + `packages/shared/src/deep-link.ts` |
| Workflows, tags, release process          | [[Architecture-Releases-and-CI]]                                           |

Merged to `main` → CI syncs `docs/wiki/` to the [GitHub Wiki](https://github.com/teofanis/ybdownloader/wiki) automatically.

## App READMEs

- [Web](https://github.com/teofanis/ybdownloader/blob/main/apps/web/README.md)
- [Desktop packaging](https://github.com/teofanis/ybdownloader/blob/main/apps/desktop/build/README.md)
- [Extension](https://github.com/teofanis/ybdownloader/blob/main/apps/extension/README.md)
- [E2E tests](https://github.com/teofanis/ybdownloader/blob/main/apps/e2e/README.md)
