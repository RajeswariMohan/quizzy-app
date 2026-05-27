-- School-configurable grades/sections and student profile fields

BEGIN;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS grade_options JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS section_options JSONB NOT NULL DEFAULT '["A","B","C","D"]'::jsonb;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS grade VARCHAR(20),
  ADD COLUMN IF NOT EXISTS section VARCHAR(20);

-- Seed defaults for the dev test school
UPDATE schools
SET
  grade_options = '[
    "Pre-KG","LKG","UKG",
    "Class 1","Class 2","Class 3","Class 4","Class 5",
    "Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"
  ]'::jsonb,
  section_options = '["A","B","C","D"]'::jsonb
WHERE id = '11111111-1111-1111-1111-111111111111'
  AND grade_options = '[]'::jsonb;

COMMIT;
