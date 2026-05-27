-- Published quiz with sample questions for student flow testing

-- Remove legacy seed rows that fail strict UUID v4 validation in DTOs
DELETE FROM student_responses
WHERE question_id IN (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

DELETE FROM questions
WHERE id IN (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

UPDATE quizzes
SET
  status = 'PUBLISHED',
  published_at = NOW(),
  audience_scope = 'GRADE_SECTION',
  audience_targets = '[{"grade": "Class 5", "section": "A"}]'::jsonb
WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

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
ON CONFLICT (id) DO NOTHING;
