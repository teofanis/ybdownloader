# Contributing to YBDownloader

Thanks for your interest in contributing! This project is a **pnpm monorepo** with a Wails desktop app, browser extension, and shared packages.

## Getting Started

1. Fork the repo
2. Clone your fork
3. Set up the dev environment:

```bash
# First clone (repo root) — enables Corepack and installs deps
./scripts/setup-dev.sh

# Desktop app (hot reload)
pnpm dev:desktop

# Browser extension
pnpm dev:extension
```

**Tooling automation:** `packageManager` in `package.json` pins pnpm. On `pnpm install`, the `preinstall` hook runs `scripts/ensure-corepack.mjs`, which calls `corepack prepare` and downloads that pnpm version if it is not cached yet. You only need `corepack enable` once per machine (Node 24+ bundles Corepack); `./scripts/setup-dev.sh` does that for you.

See the [README](README.md) for platform-specific dependencies (GTK/WebKit on Linux, Wails CLI, etc.).

### Package manager

**Use pnpm only.** npm and yarn are blocked via `only-allow` on install.

| Tool         | Pin              | Where                                                |
| ------------ | ---------------- | ---------------------------------------------------- |
| Node.js 24+  | `engines.node`   | `package.json`                                       |
| pnpm 10.12.1 | `packageManager` | `package.json` (Corepack; CI uses `corepack enable`) |

Project pnpm settings (hoisting, supply chain) are in `pnpm-workspace.yaml`. `.npmrc` only sets `engine-strict=true`.

```bash
# Wrong — will fail at preinstall
npm install
yarn install

# Correct (from repo root, after corepack enable)
pnpm install
corepack pnpm install   # if a global pnpm shadows Corepack
./scripts/setup-dev.sh  # first-time setup; always safe
```

## Development Workflow

### Branch Naming

- `feature/playlist-support`
- `fix/download-timeout`
- `refactor/queue-manager`

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add playlist download support
fix: handle timeout when fetching metadata
docs: update contributing guidelines
refactor(queue): simplify job processing
test: add coverage for converter edge cases
```

Pre-commit hooks run via Husky + lint-staged. Use `pnpm exec lint-staged` if you need to run them manually.

### Code Style

**Go** (`apps/desktop/`):

- `gofmt` and `golangci-lint` via pre-commit
- `go.work` at the repo root points at `apps/desktop`
- Keep `internal/core/` free of external dependencies

**TypeScript/React**:

- ESLint + Prettier (80 char line width)
- Zustand for state; shared types in `@ybdownload/shared`
- Shared UI primitives in `@ybdownload/ui`
- All user-facing strings via i18n (`t("key")`)

### Testing

```bash
pnpm test              # Go + JS unit tests
pnpm test:coverage     # Vitest coverage (desktop UI + shared)
pnpm e2e               # Playwright smoke tests (desktop UI + Wails mock)
pnpm run test:go       # Go only
pnpm audit             # Dependency vulnerability scan (high+)
```

## Supply Chain & Dependencies

We take dependency security seriously:

| Control                   | Where                                        |
| ------------------------- | -------------------------------------------- |
| **pnpm only**             | `only-allow` + `engines.pnpm` in preinstall  |
| **Corepack**              | `scripts/ensure-corepack.mjs` in preinstall  |
| **Frozen lockfile in CI** | `pnpm install --frozen-lockfile`             |
| **Audit in CI**           | `pnpm audit --audit-level=high`              |
| **Release age (24h)**     | `minimumReleaseAge` in `pnpm-workspace.yaml` |
| **Trust policy**          | `trustPolicy: no-downgrade`                  |
| **Install scripts**       | `onlyBuiltDependencies` whitelist            |
| **Dependabot**            | Weekly updates for Go, npm, GitHub Actions   |

When adding dependencies:

1. Prefer well-maintained packages with a clear need
2. Run `pnpm audit` after adding
3. Avoid packages with install scripts unless required (native addons)
4. Workspace packages use `workspace:*` — never copy-paste version strings for internal packages

## Submitting Changes

1. Run `pnpm test` and `pnpm audit` locally
2. Push your branch and open a PR
3. Fill out the PR template
4. Wait for CI
5. Address review feedback

### What Makes a Good PR

- Focused on one thing
- Clear description
- Tests for new behavior
- No unrelated refactors
- Follows code style

### What to Avoid

- Mixing unrelated changes
- Large refactors without discussion
- Adding dependencies without justification
- Using npm/yarn or committing `package-lock.json`

## Project Structure

```
apps/
├── desktop/          # Wails (Go + React UI)
├── extension/        # Plasmo browser extension
└── e2e/              # Playwright tests
packages/
├── shared/           # URLs, formats, deep links
└── ui/               # Shared React components
```

## Adding Translations

1. Add keys to all files in `apps/desktop/frontend/src/locales/`
2. Use `t("your.new.key")` in components
3. CI runs `pnpm --filter @ybdownload/desktop-ui i18n:check`

## Need Help?

- Check existing issues and PRs
- Open an issue before large changes
- Ask in your PR if unsure

## Code of Conduct

Be respectful. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

Thanks for contributing!
