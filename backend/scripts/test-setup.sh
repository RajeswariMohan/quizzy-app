#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Starting test PostgreSQL (port 5433)..."
docker compose -f docker-compose.test.yml up -d --wait

psql_exec() {
  docker compose -f docker-compose.test.yml exec -T postgres \
    psql -U quizzy -d quizzy -v ON_ERROR_STOP=1 "$@"
}

table_exists() {
  psql_exec -tAc "SELECT to_regclass('public.$1') IS NOT NULL;" | tr -d '[:space:]'
}

if [ "$(table_exists schools)" != "t" ]; then
  echo "==> Applying initial schema migration..."
  psql_exec < database/migrations/001_initial_schema.sql
else
  echo "==> Initial schema already present — skipping 001"
fi

if [ "$(table_exists ai_generation_tasks)" != "t" ]; then
  echo "==> Applying AI generation migration..."
  psql_exec < database/migrations/002_ai_generation_tasks.sql
else
  echo "==> AI generation schema already present — skipping 002"
fi

echo "==> Seeding test users..."
psql_exec < database/seeds/test-auth.seed.sql

echo "==> Seeding test class and quiz..."
psql_exec < database/seeds/test-quiz-content.seed.sql

export JWT_SECRET="${JWT_SECRET:-test-jwt-secret-for-e2e-only}"
export REDIS_HOST=localhost
export REDIS_PORT=6380
export DATABASE_HOST=localhost
export DATABASE_PORT=5433
export DATABASE_USER=quizzy
export DATABASE_PASSWORD=quizzy
export DATABASE_NAME=quizzy

echo "==> Running unit tests..."
npm test

echo "==> Running e2e tests..."
npm run test:e2e

echo "==> All tests passed."
