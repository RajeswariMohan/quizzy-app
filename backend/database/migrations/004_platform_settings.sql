-- Platform-wide feature flags and settings (singleton row)

BEGIN;

CREATE TABLE platform_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings    JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES users (id) ON DELETE SET NULL
);

INSERT INTO platform_settings (id, settings)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '{
    "aiGenerationEnabled": true,
    "studentLeaderboardEnabled": true,
    "parentPortalEnabled": true,
    "teacherQuizCreationEnabled": true,
    "gamificationEnabled": true,
    "maintenanceMode": false,
    "maintenanceMessage": null
  }'::jsonb
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
