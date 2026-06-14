# Developer docs

Architecture wiki — source files in `docs/wiki/`, synced to [GitHub Wiki](https://github.com/teofanis/ybdownloader/wiki) by CI.

| Wiki page              | File                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| Home                   | [wiki/Home.md](./wiki/Home.md)                                                           |
| Monorepo               | [wiki/Architecture-Monorepo.md](./wiki/Architecture-Monorepo.md)                         |
| Web                    | [wiki/Architecture-Web.md](./wiki/Architecture-Web.md)                                   |
| Desktop                | [wiki/Architecture-Desktop.md](./wiki/Architecture-Desktop.md)                           |
| Desktop updates        | [wiki/Architecture-Desktop-Updates.md](./wiki/Architecture-Desktop-Updates.md)           |
| Extension & deep links | [wiki/Architecture-Extension-Deep-Links.md](./wiki/Architecture-Extension-Deep-Links.md) |
| Releases & CI          | [wiki/Architecture-Releases-and-CI.md](./wiki/Architecture-Releases-and-CI.md)           |

**Wiki** = how things connect. **App READMEs** = build/run commands.

## Automatic sync

On push to `main` that touches `docs/wiki/**`, [`.github/workflows/wiki-sync.yml`](../.github/workflows/wiki-sync.yml) copies every `*.md` file into the wiki repo and pushes.

Manual run: **Actions → Sync Wiki → Run workflow**.

**One-time:** the wiki must have a first page (you already created `Home`). After that, CI keeps it updated.

## Edit workflow

1. Change files under `docs/wiki/`
2. Merge to `main`
3. CI updates the wiki (usually within a minute)
