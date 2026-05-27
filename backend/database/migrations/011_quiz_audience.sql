-- Quiz publish audience: whole school or selected grade + section pairs

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS audience_scope VARCHAR(20) NOT NULL DEFAULT 'SCHOOL';

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS audience_targets JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill published quizzes to match their class grade/section when possible
UPDATE quizzes q
SET
  audience_scope = 'GRADE_SECTION',
  audience_targets = jsonb_build_array(
    jsonb_build_object(
      'grade',
      COALESCE(NULLIF(TRIM(q.grade), ''), NULLIF(TRIM(c.grade), '')),
      'section',
      NULLIF(TRIM(c.section), '')
    )
  )
FROM classes c
WHERE q.class_id = c.id
  AND q.status = 'PUBLISHED'
  AND COALESCE(NULLIF(TRIM(q.grade), ''), NULLIF(TRIM(c.grade), '')) IS NOT NULL
  AND NULLIF(TRIM(c.section), '') IS NOT NULL;
