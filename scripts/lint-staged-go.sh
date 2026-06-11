#!/bin/bash
# Lint staged Go files

set -e

FILES="$@"

if [ -z "$FILES" ]; then
    exit 0
fi

echo "🔍 Checking Go files..."

UNFORMATTED=$(gofmt -l $FILES 2>/dev/null || true)
if [ -n "$UNFORMATTED" ]; then
    echo "❌ The following files need formatting with 'gofmt':"
    echo "$UNFORMATTED"
    exit 1
fi

echo "🔍 Running go vet..."
REPO_ROOT=$(pwd)
DESKTOP_ROOT="$REPO_ROOT/apps/desktop"
PACKAGES=""
for file in $FILES; do
    dir=$(dirname "$file")
    if [[ "$dir" == "$DESKTOP_ROOT"* ]]; then
        rel=".${dir#$DESKTOP_ROOT}"
    elif [[ "$dir" == "$REPO_ROOT"* ]]; then
        rel=".${dir#$REPO_ROOT}"
    else
        rel="$dir"
    fi
    PACKAGES="$PACKAGES $rel"
done
PACKAGES=$(echo "$PACKAGES" | tr ' ' '\n' | sort -u | tr '\n' ' ')

cd apps/desktop
go vet $PACKAGES 2>&1 || {
    echo "❌ go vet found issues"
    exit 1
}

if command -v golangci-lint &> /dev/null; then
    echo "🔍 Running golangci-lint..."
    golangci-lint run --new-from-rev=HEAD~1 --timeout=2m 2>&1 || {
        echo "❌ golangci-lint found issues"
        exit 1
    }
fi

echo "✅ Go checks passed!"
