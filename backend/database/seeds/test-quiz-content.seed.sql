-- Class + draft quiz for quiz/question module e2e tests
INSERT INTO classes (id, school_id, name, grade, section, academic_year)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '11111111-1111-1111-1111-111111111111',
  '5A',
  '5',
  'A',
  '2025-2026'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quizzes (
  id,
  school_id,
  class_id,
  created_by_user_id,
  title,
  status,
  subject,
  topic,
  board,
  grade
)
VALUES (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '11111111-1111-1111-1111-111111111111',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '22222222-2222-2222-2222-222222222222',
  'Science Quiz — Photosynthesis',
  'DRAFT',
  'Science',
  'Photosynthesis',
  'CBSE',
  'Class 5'
)
ON CONFLICT (id) DO NOTHING;
