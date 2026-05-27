#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if docker compose -f docker-compose.test.yml ps --status running postgres 2>/dev/null | grep -q postgres; then
  echo "==> Applying 008 via docker (port 5433)..."
  docker compose -f docker-compose.test.yml exec -T postgres \
    psql -U quizzy -d quizzy -v ON_ERROR_STOP=1 < database/migrations/008_user_feedback.sql
else
  echo "==> Applying 008 via local psql..."
  PGPASSWORD="${DATABASE_PASSWORD:-quizzy}" psql \
    -h "${DATABASE_HOST:-localhost}" \
    -p "${DATABASE_PORT:-5432}" \
    -U "${DATABASE_USER:-quizzy}" \
    -d "${DATABASE_NAME:-quizzy}" \
    -v ON_ERROR_STOP=1 \
    -f database/migrations/008_user_feedback.sql
fi

echo "==> Done. user_feedback table is ready."
