#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Applying migration 009 (school subject_options)..."
docker compose -f docker-compose.test.yml exec -T postgres \
  psql -U quizzy -d quizzy -v ON_ERROR_STOP=1 \
  < database/migrations/009_school_subject_options.sql

echo "==> Migration 009 applied."
