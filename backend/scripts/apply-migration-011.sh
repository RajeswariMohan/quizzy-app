#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Applying migration 011 (quiz audience)..."
docker compose -f docker-compose.test.yml exec -T postgres \
  psql -U quizzy -d quizzy -v ON_ERROR_STOP=1 \
  < database/migrations/011_quiz_audience.sql

echo "==> Migration 011 applied."
