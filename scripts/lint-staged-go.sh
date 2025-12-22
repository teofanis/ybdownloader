#!/bin/bash
# Lint staged Go files
# This script is called by lint-staged with the list of staged Go files

set -e

# Get staged Go files passed as arguments
FILES="$@"

if [ -z "$FILES" ]; then
    exit 0
fi

echo "🔍 Checking Go files..."

# Run gofmt check (don't modify, just check)
UNFORMATTED=$(gofmt -l $FILES 2>/dev/null || true)
if [ -n "$UNFORMATTED" ]; then
    echo "❌ The following files need formatting with 'gofmt':"
    echo "$UNFORMATTED"
    echo ""
    echo "Run 'gofmt -w <file>' to fix, or 'go fmt ./...' to format all."
    exit 1
fi

# Run go vet on the packages containing staged files
echo "🔍 Running go vet..."
PACKAGES=$(echo "$FILES" | xargs -n1 dirname | sort -u | sed 's|^|./|')
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

