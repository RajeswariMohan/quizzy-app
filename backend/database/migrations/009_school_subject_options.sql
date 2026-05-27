-- School-configurable subject list for quizzes and student onboarding

BEGIN;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS subject_options JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE schools
SET subject_options = '[
  "Science",
  "Mathematics",
  "English",
  "Social Studies",
  "Hindi",
  "Computer Science",
  "EVS",
  "General Knowledge"
]'::jsonb
WHERE id = '11111111-1111-1111-1111-111111111111'
  AND (subject_options IS NULL OR subject_options = '[]'::jsonb);

COMMIT;
