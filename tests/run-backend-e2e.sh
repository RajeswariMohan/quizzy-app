#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/backend"

bash scripts/test-db-prep.sh

echo "==> Backend e2e tests (Jest)"
npm run test:e2e
