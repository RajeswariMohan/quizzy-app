#!/usr/bin/env bash
# Prepares Docker test DB (migrations + seeds). Sourced by test-setup.sh and e2e runner.
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

if [ "$(table_exists parent_student_links)" != "t" ]; then
  echo "==> Applying parent-student links migration..."
  psql_exec < database/migrations/003_parent_student_links.sql
else
  echo "==> Parent-student links schema already present — skipping 003"
fi

if [ "$(table_exists platform_settings)" != "t" ]; then
  echo "==> Applying platform settings migration..."
  psql_exec < database/migrations/004_platform_settings.sql
else
  echo "==> Platform settings schema already present — skipping 004"
fi

if ! psql_exec -tAc "SELECT column_name FROM information_schema.columns WHERE table_name='schools' AND column_name='max_students';" | grep -q max_students; then
  echo "==> Applying school user limits migration..."
  psql_exec < database/migrations/005_school_user_limits.sql
else
  echo "==> School user limits already present — skipping 005"
fi

if [ "$(table_exists user_sessions)" != "t" ]; then
  echo "==> Applying user sessions migration..."
  psql_exec < database/migrations/007_user_sessions.sql
else
  echo "==> User sessions schema already present — skipping 007"
fi

if [ "$(table_exists user_feedback)" != "t" ]; then
  echo "==> Applying user feedback migration..."
  psql_exec < database/migrations/008_user_feedback.sql
else
  echo "==> User feedback schema already present — skipping 008"
fi

if ! psql_exec -tAc "SELECT column_name FROM information_schema.columns WHERE table_name='schools' AND column_name='subject_options';" | grep -q subject_options; then
  echo "==> Applying school subject options migration..."
  psql_exec < database/migrations/009_school_subject_options.sql
else
  echo "==> School subject options already present — skipping 009"
fi

if ! psql_exec -tAc "SELECT column_name FROM information_schema.columns WHERE table_name='quizzes' AND column_name='audience_scope';" | grep -q audience_scope; then
  echo "==> Applying quiz audience migration..."
  psql_exec < database/migrations/011_quiz_audience.sql
else
  echo "==> Quiz audience columns already present — skipping 011"
fi

if ! psql_exec -tAc "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='parent_email';" | grep -q parent_email; then
  echo "==> Applying user signup parent email migration..."
  psql_exec < database/migrations/012_user_signup_parent_email.sql
else
  echo "==> User signup parent email columns already present — skipping 012"
fi

if ! psql_exec -tAc "SELECT column_name FROM information_schema.columns WHERE table_name='schools' AND column_name='grade_section_map';" | grep -q grade_section_map; then
  echo "==> Applying grade sections and subscription migration..."
  psql_exec < database/migrations/013_grade_sections_and_subscription.sql
else
  echo "==> Grade sections and subscription columns already present — skipping 013"
fi

if ! psql_exec -tAc "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='username';" | grep -q username; then
  echo "==> Applying user username migration..."
  psql_exec < database/migrations/014_user_username.sql
else
  echo "==> User username column already present — skipping 014"
fi

if ! psql_exec -tAc "SELECT settings->'subscriptionPackages' FROM platform_settings WHERE id='00000000-0000-0000-0000-000000000001';" | grep -q BASIC; then
  echo "==> Applying subscription package templates migration..."
  psql_exec < database/migrations/015_subscription_package_templates.sql
else
  echo "==> Subscription package templates already present — skipping 015"
fi

echo "==> Resetting platform settings and school package defaults..."
psql_exec < database/seeds/test-platform-settings.seed.sql

echo "==> Seeding test users..."
psql_exec < database/seeds/test-auth.seed.sql

echo "==> Seeding parent-student links..."
psql_exec < database/seeds/test-parent-link.seed.sql

echo "==> Seeding test class and quiz..."
psql_exec < database/seeds/test-quiz-content.seed.sql
psql_exec < database/seeds/test-student-quiz.seed.sql

export JWT_SECRET="${JWT_SECRET:-test-jwt-secret-for-e2e-only}"
export REDIS_HOST=localhost
export REDIS_PORT=6380
export DATABASE_HOST=localhost
export DATABASE_PORT=5433
export DATABASE_USER=quizzy
export DATABASE_PASSWORD=quizzy
export DATABASE_NAME=quizzy

echo "==> Test database ready."
