#!/bin/bash
set -e

# Get list of staged extension files
FILES="$@"

if [ -z "$FILES" ]; then
  echo "No extension files to lint"
  exit 0
fi

cd browser-extension

# Run TypeScript check
echo "Running TypeScript check on extension..."
npx tsc --noEmit

# Run prettier check
echo "Running Prettier check on extension..."
npx prettier --check ../browser-extension --ignore-path .gitignore 2>/dev/null || {
  echo "Prettier check failed. Run 'cd browser-extension && npx prettier --write .' to fix."
  exit 1
}

echo "Extension lint passed!"

