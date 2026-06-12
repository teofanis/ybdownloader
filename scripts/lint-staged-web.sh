#!/bin/bash
set -e

FILES="$@"

if [ -z "$FILES" ]; then
  echo "No web files to lint"
  exit 0
fi

cd apps/web

echo "Running Astro check..."
pnpm exec astro check

echo "Running Prettier check..."
pnpm exec prettier --check . --ignore-path .prettierignore

echo "Web lint passed!"
