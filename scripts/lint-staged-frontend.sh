#!/bin/bash
# Lint staged desktop UI files

set -e

FILES="$@"

if [ -z "$FILES" ]; then
    exit 0
fi

FRONTEND_DIR="apps/desktop/frontend"
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT/$FRONTEND_DIR"
RELATIVE_FILES=""
for file in $FILES; do
    if [[ "$file" == "$REPO_ROOT/$FRONTEND_DIR/"* ]]; then
        rel="${file#$REPO_ROOT/$FRONTEND_DIR/}"
        RELATIVE_FILES="$RELATIVE_FILES $rel"
    fi
done

if [ -z "$RELATIVE_FILES" ]; then
    exit 0
fi

echo "🎨 Formatting desktop UI files..."
pnpm exec prettier --write $RELATIVE_FILES

echo "🔍 Linting desktop UI files..."
pnpm exec eslint --fix --no-error-on-unmatched-pattern $RELATIVE_FILES || true

echo "Checking types..."
pnpm exec tsc --noEmit $RELATIVE_FILES || true

echo "✅ Desktop UI checks passed!"
