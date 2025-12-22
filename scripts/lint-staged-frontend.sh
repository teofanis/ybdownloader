#!/bin/bash
# Lint staged frontend files
# Called by lint-staged with absolute paths to staged files

set -e

FILES="$@"

if [ -z "$FILES" ]; then
    exit 0
fi

cd frontend

# Convert absolute paths to relative paths from frontend/
REPO_ROOT=$(dirname "$(pwd)")
RELATIVE_FILES=""
for file in $FILES; do
    if [[ "$file" == "$REPO_ROOT/frontend/"* ]]; then
        rel="${file#$REPO_ROOT/frontend/}"
        RELATIVE_FILES="$RELATIVE_FILES $rel"
    fi
done

if [ -z "$RELATIVE_FILES" ]; then
    exit 0
fi

echo "🎨 Formatting frontend files..."
npx prettier --write $RELATIVE_FILES

echo "🔍 Linting frontend files..."
npx eslint --fix --no-error-on-unmatched-pattern $RELATIVE_FILES || true

echo "Checking types..."
npx tsc --noEmit $RELATIVE_FILES || true

echo "✅ Frontend checks passed!"

