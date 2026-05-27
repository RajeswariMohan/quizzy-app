-- Link test parent to test student (same school)
INSERT INTO parent_student_links (id, school_id, parent_user_id, student_user_id)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  '55555555-5555-5555-5555-555555555555',
  '33333333-3333-3333-3333-333333333333'
)
ON CONFLICT (school_id, parent_user_id, student_user_id) DO NOTHING;
