#!/usr/bin/env bash
# Reset local Docker DB to super-admin-only fresh start (manual testing).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "${CONFIRM_RESET:-}" != "yes" ]; then
  echo "This will DELETE all schools (except unlisted), users (except super admin),"
  echo "quizzes, sessions, and feedback in the local Docker Postgres on port 5433."
  echo ""
  echo "Re-run with: CONFIRM_RESET=yes bash scripts/reset-to-superadmin-only.sh"
  exit 1
fi

echo "==> Starting PostgreSQL and Redis..."
docker compose -f docker-compose.test.yml up -d --wait

psql_exec() {
  docker compose -f docker-compose.test.yml exec -T postgres \
    psql -U quizzy -d quizzy -v ON_ERROR_STOP=1 "$@"
}

echo "==> Resetting database to super-admin-only state..."
psql_exec < database/seeds/superadmin-only-reset.sql

echo "==> Flushing Redis (BullMQ queue)..."
docker compose -f docker-compose.test.yml exec -T redis redis-cli FLUSHDB >/dev/null

echo ""
echo "==> Fresh start complete."
echo ""
echo "Login:"
echo "  Email:    superadmin@quizzy.platform"
echo "  Password: TestPassword1!"
echo ""
echo "Next steps:"
echo "  1. Clear browser localStorage (quizzy_access_token, quizzy_school_filter) or log out"
echo "  2. Restart backend if it is already running (picks up env + code changes)"
echo "  3. Start backend:  cd backend && npm run start:dev"
echo "  4. Start frontend: cd frontend && npm run dev"
echo "  5. Create your first school at /admin/schools"
echo ""
echo "To restore test fixtures for automated tests:"
echo "  bash scripts/test-db-prep.sh"
