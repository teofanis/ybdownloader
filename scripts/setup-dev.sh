#!/usr/bin/env bash
# One-shot dev setup from repo root: enable Corepack, install pinned pnpm, install deps.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if ! command -v corepack >/dev/null 2>&1; then
  echo "corepack not found. Install Node.js 24+ (Corepack is bundled)." >&2
  exit 1
fi

corepack enable
exec corepack pnpm install "$@"
