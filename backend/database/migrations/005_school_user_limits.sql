-- Per-school user capacity limits (null = unlimited)

BEGIN;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS max_students INT,
  ADD COLUMN IF NOT EXISTS max_teachers INT,
  ADD COLUMN IF NOT EXISTS max_parents INT;

UPDATE schools
SET
  max_students = COALESCE(max_students, 500),
  max_teachers = COALESCE(max_teachers, 50),
  max_parents = COALESCE(max_parents, 200)
WHERE id = '11111111-1111-1111-1111-111111111111';

COMMIT;
