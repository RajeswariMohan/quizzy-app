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

INSERT INTO users (id, school_id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  'teacher@test.school',
  '$2b$10$ADE5B3E8cyVg9CsCEsL6N.GGf3Yj/StZtrBcX1tbuTGcsXI3dh1D6',
  'TEACHER',
  'Test',
  'Teacher',
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  school_id = EXCLUDED.school_id,
  password_hash = EXCLUDED.password_hash;

INSERT INTO users (id, school_id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'student@test.school',
  '$2b$10$ADE5B3E8cyVg9CsCEsL6N.GGf3Yj/StZtrBcX1tbuTGcsXI3dh1D6',
  'STUDENT',
  'Test',
  'Student',
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  school_id = EXCLUDED.school_id,
  password_hash = EXCLUDED.password_hash,
  grade = 'Class 5',
  section = 'A';

INSERT INTO users (id, school_id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  NULL,
  'superadmin@quizzy.platform',
  '$2b$10$ADE5B3E8cyVg9CsCEsL6N.GGf3Yj/StZtrBcX1tbuTGcsXI3dh1D6',
  'SUPER_ADMIN',
  'Super',
  'Admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  school_id = EXCLUDED.school_id,
  password_hash = EXCLUDED.password_hash;

INSERT INTO users (id, school_id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  '11111111-1111-1111-1111-111111111111',
  'parent@test.school',
  '$2b$10$ADE5B3E8cyVg9CsCEsL6N.GGf3Yj/StZtrBcX1tbuTGcsXI3dh1D6',
  'PARENT',
  'Test',
  'Parent',
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  school_id = EXCLUDED.school_id,
  password_hash = EXCLUDED.password_hash;

INSERT INTO users (id, school_id, email, password_hash, role, first_name, last_name, is_active)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  '11111111-1111-1111-1111-111111111111',
  'admin@test.school',
  '$2b$10$ADE5B3E8cyVg9CsCEsL6N.GGf3Yj/StZtrBcX1tbuTGcsXI3dh1D6',
  'SCHOOL_ADMIN',
  'School',
  'Admin',
  true
)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  school_id = EXCLUDED.school_id,
  password_hash = EXCLUDED.password_hash;
