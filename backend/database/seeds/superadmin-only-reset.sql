-- Wipe tenant data; keep only super admin + platform unlisted school.
-- Password for super admin: TestPassword1!

BEGIN;

-- CASCADE removes classes, quizzes, questions, student_responses,
-- parent_student_links, ai_generation_tasks, and tenant-scoped users.
DELETE FROM schools
WHERE slug <> 'unlisted';

DELETE FROM users
WHERE role <> 'SUPER_ADMIN';

DELETE FROM user_sessions;
DELETE FROM user_feedback;

INSERT INTO users (
  id,
  school_id,
  email,
  password_hash,
  role,
  first_name,
  last_name,
  is_active
)
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
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

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
ON CONFLICT (slug) DO UPDATE SET
  is_active = true,
  max_students = NULL,
  max_teachers = NULL,
  max_parents = NULL;

UPDATE platform_settings
SET settings = jsonb_build_object(
  'aiGenerationEnabled', true,
  'studentLeaderboardEnabled', true,
  'parentPortalEnabled', true,
  'teacherQuizCreationEnabled', true,
  'gamificationEnabled', true,
  'maintenanceMode', false,
  'maintenanceMessage', null,
  'subscriptionPackages', jsonb_build_object(
    'BASIC', jsonb_build_object(
      'publishScopeGrade', true,
      'publishScopeSchool', false,
      'publishScopeSection', false,
      'aiGenerationEnabled', false,
      'teacherQuizCreationEnabled', true,
      'studentLeaderboardEnabled', false,
      'parentPortalEnabled', true,
      'gamificationEnabled', false,
      'bulkUserImportEnabled', true
    ),
    'STANDARD', jsonb_build_object(
      'publishScopeGrade', true,
      'publishScopeSchool', true,
      'publishScopeSection', false,
      'aiGenerationEnabled', true,
      'teacherQuizCreationEnabled', true,
      'studentLeaderboardEnabled', true,
      'parentPortalEnabled', true,
      'gamificationEnabled', true,
      'bulkUserImportEnabled', true
    ),
    'PREMIUM', jsonb_build_object(
      'publishScopeGrade', true,
      'publishScopeSchool', true,
      'publishScopeSection', true,
      'aiGenerationEnabled', true,
      'teacherQuizCreationEnabled', true,
      'studentLeaderboardEnabled', true,
      'parentPortalEnabled', true,
      'gamificationEnabled', true,
      'bulkUserImportEnabled', true
    )
  )
)
WHERE id = '00000000-0000-0000-0000-000000000001';

COMMIT;
