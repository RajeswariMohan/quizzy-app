#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Applying migration 010 (fix seed password hashes)..."
docker compose -f docker-compose.test.yml exec -T postgres \
  psql -U quizzy -d quizzy -v ON_ERROR_STOP=1 \
  < database/migrations/010_fix_seed_password_hashes.sql

echo "==> Migration 010 applied."
