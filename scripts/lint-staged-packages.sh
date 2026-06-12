#!/bin/bash
# Lint staged shared package files

set -e

FILES="$@"

if [ -z "$FILES" ]; then
  exit 0
fi

REPO_ROOT=$(pwd)
RELATIVE_FILES=""

for file in $FILES; do
  if [[ "$file" == "$REPO_ROOT/packages/"* ]]; then
    rel="${file#$REPO_ROOT/}"
    RELATIVE_FILES="$RELATIVE_FILES $rel"
  fi
done

if [ -z "$RELATIVE_FILES" ]; then
  exit 0
fi

echo "🔍 Type-checking shared packages..."
pnpm --filter @ybdownload/shared type-check
pnpm --filter @ybdownload/ui type-check

echo "✅ Package checks passed!"
