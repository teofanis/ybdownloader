# Contributing to YBDownloader

Thanks for your interest in contributing! This project started as a side project and contributions are welcome.

## Getting Started

1. Fork the repo
2. Clone your fork
3. Set up the dev environment:

```bash
# Install deps
npm install
cd frontend && npm install && cd ..

# Run in dev mode
wails dev
```

See the [README](README.md) for detailed setup instructions including platform-specific dependencies.

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feature/playlist-support`
- `fix/download-timeout`
- `refactor/queue-manager`

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/). Format your commit messages like:

```
feat: add playlist download support
fix: handle timeout when fetching metadata
docs: update contributing guidelines
refactor(queue): simplify job processing
test: add coverage for converter edge cases
```

Pre-commit hooks run automatically and will lint your code. Let them run.

### Code Style

**Go:**
- `gofmt` and `golangci-lint` run via pre-commit
- Follow standard Go conventions
- Use `log/slog` for logging (see `internal/infra/logging`)
- Keep dependencies minimal in `core/` package

**TypeScript/React:**
- ESLint + Prettier (80 char line width)
- Use Zustand for state management
- All user-facing strings must use i18n (`t("key")`)
- Prefer function components with hooks

### Testing

Write tests for new functionality. Run the full suite before submitting:

```bash
# Go
go test ./...

# Frontend
cd frontend && npm test
```

Coverage thresholds are enforced in CI. Aim for meaningful tests, not just line coverage.

## Submitting Changes

1. Make sure all tests pass locally
2. Push your branch and open a PR
3. Fill out the PR template
4. Wait for CI to pass
5. Address any review feedback

### What Makes a Good PR

- Focused on one thing
- Has a clear description
- Includes tests if adding functionality
- Doesn't break existing behavior
- Follows the code style

### What to Avoid

- Mixing unrelated changes
- Large refactors without discussion first
- Adding dependencies without good reason
- Skipping tests for "simple" changes

## Project Structure

```
internal/
├── app/          # Wails bindings
├── core/         # Domain models, interfaces (no external deps)
└── infra/        # Implementations (downloader, queue, converter, etc.)

frontend/src/
├── features/     # Feature modules (downloads, converter, settings, etc.)
├── components/   # Shared UI components
├── store/        # Zustand state
├── locales/      # Translations (add strings to all 7 language files)
└── types/        # TypeScript interfaces
```

## Adding Translations

If you add new UI text:

1. Add the key to all files in `frontend/src/locales/`
2. Use the translation in your component: `t("your.new.key")`
3. CI will fail if translations are incomplete

If you only speak one language, add the English string to all files and note it in your PR—someone can help translate.

## Need Help?

- Check existing issues and PRs
- Open an issue for discussion before big changes
- Ask questions in your PR if you're unsure about something

## Code of Conduct

Be respectful. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

Thanks for contributing!

