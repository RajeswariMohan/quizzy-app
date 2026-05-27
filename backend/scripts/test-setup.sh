#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

bash scripts/test-db-prep.sh

echo "==> Running unit tests..."
npm test

echo "==> Running e2e tests..."
npm run test:e2e

echo "==> All tests passed."
