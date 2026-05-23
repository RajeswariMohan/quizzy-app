-- Test seed for auth / RBAC verification (idempotent)
INSERT INTO schools (id, name, slug, primary_color, secondary_color)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test School',
  'test-school',
  '#2563EB',
  '#7C3AED'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO users (id, school_id, email, password_hash, role, first_name, last_name)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'teacher@test.school',
  '$2b$10$testhashplaceholder000000000000000000000000000',
  'TEACHER',
  'Test',
  'Teacher'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, school_id, email, password_hash, role, first_name, last_name)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'student@test.school',
  '$2b$10$testhashplaceholder000000000000000000000000000',
  'STUDENT',
  'Test',
  'Student'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, school_id, email, password_hash, role, first_name, last_name)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  NULL,
  'superadmin@quizzy.platform',
  '$2b$10$testhashplaceholder000000000000000000000000000',
  'SUPER_ADMIN',
  'Super',
  'Admin'
)
ON CONFLICT (id) DO NOTHING;
