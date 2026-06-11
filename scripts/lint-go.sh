#!/bin/bash
# Full Go linting script (not just staged files)

set -e

cd apps/desktop

echo "🔍 Running gofmt check..."
UNFORMATTED=$(gofmt -l . 2>/dev/null | grep -v vendor || true)
if [ -n "$UNFORMATTED" ]; then
    echo "❌ The following files need formatting:"
    echo "$UNFORMATTED"
    exit 1
fi

echo "🔍 Running go vet..."
go vet ./...

echo "🔍 Running golangci-lint..."
if command -v golangci-lint &> /dev/null; then
    if ! golangci-lint run --timeout=5m; then
        # Stale cache entries can reference pre-monorepo paths (e.g. ../../internal/...).
        echo "⚠️  golangci-lint failed; clearing cache and retrying once..."
        golangci-lint cache clean
        golangci-lint run --timeout=5m
    fi
else
    echo "⚠️  golangci-lint not installed, skipping..."
fi

echo "✅ All Go checks passed!"
