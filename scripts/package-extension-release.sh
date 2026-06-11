#!/usr/bin/env bash
# Build and zip Chrome + Firefox extension artifacts for release.
set -euo pipefail

VERSION="${1:-${VERSION:?Usage: package-extension-release.sh <version>}}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EXT="$ROOT/apps/extension"

cd "$EXT"

pnpm run build:chrome
pnpm run build:firefox

(
  cd build/chrome-mv3-prod
  zip -rq "../../chrome-extension-${VERSION}.zip" .
)
(
  cd build/firefox-mv3-prod
  zip -rq "../../firefox-extension-${VERSION}.zip" .
)

echo "Created apps/extension/chrome-extension-${VERSION}.zip"
echo "Created apps/extension/firefox-extension-${VERSION}.zip"
