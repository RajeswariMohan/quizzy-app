-- Allow bulk CSV user import on BASIC schools (matches DEFAULT_SUBSCRIPTION_PACKAGES).
UPDATE platform_settings
SET settings = jsonb_set(
  settings,
  '{subscriptionPackages,BASIC,bulkUserImportEnabled}',
  'true'::jsonb,
  true
)
WHERE id = '00000000-0000-0000-0000-000000000001';
