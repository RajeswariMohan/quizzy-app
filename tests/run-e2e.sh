#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT/backend"
docker compose -f docker-compose.test.yml up -d --wait
bash scripts/test-db-prep.sh

cd "$ROOT"
export PLAYWRIGHT_BROWSERS_PATH=0
if [ ! -d "$ROOT/node_modules/playwright-core/.local-browsers/chromium_headless_shell-1223" ]; then
  echo "==> Installing Playwright Chromium (project-local)..."
  npx playwright install chromium
fi
npx playwright test --config tests/e2e/playwright.config.ts "$@"
