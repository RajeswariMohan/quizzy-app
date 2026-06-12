-- Reset platform settings to known test defaults (idempotent)

BEGIN;

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

UPDATE schools
SET subscription_tier = 'STANDARD'
WHERE id = '11111111-1111-1111-1111-111111111111';

COMMIT;
