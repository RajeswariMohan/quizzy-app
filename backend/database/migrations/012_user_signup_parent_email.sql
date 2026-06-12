-- Student parent email + unlisted school signup note; platform unlisted school tenant

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS parent_email VARCHAR(320),
  ADD COLUMN IF NOT EXISTS signup_school_note TEXT;

CREATE INDEX IF NOT EXISTS idx_users_school_parent_email_student
  ON users (school_id, lower(parent_email))
  WHERE role = 'STUDENT' AND parent_email IS NOT NULL;

INSERT INTO schools (
  id,
  name,
  slug,
  primary_color,
  secondary_color,
  is_active,
  grade_options,
  section_options
)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'Unlisted / Other schools',
  'unlisted',
  '#64748B',
  '#475569',
  true,
  '[
    "Pre-KG","LKG","UKG",
    "Class 1","Class 2","Class 3","Class 4","Class 5",
    "Class 6","Class 7","Class 8","Class 9","Class 10","Class 11","Class 12"
  ]'::jsonb,
  '["A","B","C","D"]'::jsonb
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;
