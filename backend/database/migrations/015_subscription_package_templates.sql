-- Global subscription package feature templates (Basic / Standard / Premium)

BEGIN;

UPDATE platform_settings
SET settings = settings || jsonb_build_object(
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
WHERE id = '00000000-0000-0000-0000-000000000001'
  AND NOT (settings ? 'subscriptionPackages');

COMMIT;
