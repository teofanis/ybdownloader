#!/bin/bash
set -e

FILES="$@"

if [ -z "$FILES" ]; then
  echo "No extension files to lint"
  exit 0
fi

cd apps/extension

echo "Running TypeScript check on extension..."
pnpm exec tsc --noEmit

echo "Running Prettier check on extension..."
pnpm exec prettier --check . --ignore-path .gitignore

echo "Extension lint passed!"
