#!/bin/bash
# Lint staged Go files
# Called by lint-staged with absolute paths to staged Go files

set -e

FILES="$@"

if [ -z "$FILES" ]; then
    exit 0
fi

echo "🔍 Checking Go files..."

# Run gofmt check
UNFORMATTED=$(gofmt -l $FILES 2>/dev/null || true)
if [ -n "$UNFORMATTED" ]; then
    echo "❌ The following files need formatting with 'gofmt':"
    echo "$UNFORMATTED"
    echo ""
    echo "Run 'gofmt -w <file>' to fix, or 'go fmt ./...' to format all."
    exit 1
fi

# Get unique package directories, converting absolute paths to relative
echo "🔍 Running go vet..."
REPO_ROOT=$(pwd)
PACKAGES=""
for file in $FILES; do
    dir=$(dirname "$file")
    # Convert absolute path to relative if needed
    if [[ "$dir" == "$REPO_ROOT"* ]]; then
        dir=".${dir#$REPO_ROOT}"
    fi
    PACKAGES="$PACKAGES $dir"
done
# Remove duplicates
PACKAGES=$(echo "$PACKAGES" | tr ' ' '\n' | sort -u | tr '\n' ' ')

go vet $PACKAGES 2>&1 || {
    echo "❌ go vet found issues"
    exit 1
}

# Run golangci-lint if available
if command -v golangci-lint &> /dev/null; then
    echo "🔍 Running golangci-lint..."
    golangci-lint run --new-from-rev=HEAD~1 --timeout=2m 2>&1 || {
        echo "❌ golangci-lint found issues"
        exit 1
    }
fi

echo "✅ Go checks passed!"
