#!/usr/bin/env bash
# Apply all SQL migrations in order. Use Neon DIRECT connection string (not pooler).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MIGRATE_URL="${DATABASE_URL_DIRECT:-${DATABASE_URL:-}}"
if [ -z "$MIGRATE_URL" ]; then
  echo "Set DATABASE_URL_DIRECT (recommended) or DATABASE_URL."
  echo "Use Neon's direct connection (no -pooler) for migrations."
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is not installed."
  echo "Install the PostgreSQL client, or paste migrations into the Neon SQL Editor."
  exit 1
fi

for migration in database/migrations/*.sql; do
  echo "==> Applying $(basename "$migration")..."
  psql "$MIGRATE_URL" -v ON_ERROR_STOP=1 -f "$migration"
done

echo "==> All migrations applied."
