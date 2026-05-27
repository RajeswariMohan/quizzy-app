#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -d node_modules/vitest ]; then
  echo "==> Installing root test dependencies (vitest)..."
  npm install
fi

echo "==> Frontend unit tests (Vitest)"
npx vitest run --config tests/vitest.config.ts
