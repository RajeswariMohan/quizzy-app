#!/usr/bin/env bash
# Reset seeded student quiz state for deterministic Playwright reruns.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

docker compose -f docker-compose.test.yml exec -T postgres \
  psql -U quizzy -d quizzy -v ON_ERROR_STOP=1 <<'SQL'
DELETE FROM student_responses
WHERE student_id = '33333333-3333-3333-3333-333333333333'
  AND quiz_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

DELETE FROM questions
WHERE quiz_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
  AND id NOT IN (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
  );

INSERT INTO questions (
  id,
  school_id,
  quiz_id,
  question_text,
  options,
  correct_option_index,
  order_index,
  points,
  source_type
)
VALUES
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'Which organelle is responsible for photosynthesis?',
    '["Nucleus", "Chloroplast", "Mitochondria", "Ribosome"]'::jsonb,
    1,
    0,
    10,
    'MANUAL'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'What gas do plants absorb during photosynthesis?',
    '["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"]'::jsonb,
    2,
    1,
    10,
    'MANUAL'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '11111111-1111-1111-1111-111111111111',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'What is the main product of photosynthesis?',
    '["Glucose", "Protein", "Fat", "DNA"]'::jsonb,
    0,
    2,
    10,
    'MANUAL'
  )
ON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  correct_option_index = EXCLUDED.correct_option_index,
  order_index = EXCLUDED.order_index,
  points = EXCLUDED.points,
  source_type = EXCLUDED.source_type;

UPDATE quizzes
SET
  status = 'PUBLISHED',
  published_at = NOW(),
  audience_scope = 'GRADE_SECTION',
  audience_targets = '[{"grade": "Class 5", "section": "A"}]'::jsonb
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
SQL

echo "==> Student quiz state reset."
