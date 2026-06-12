-- Per-grade section lists and subscription tier for teacher publish scope

BEGIN;

ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS grade_section_map JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) NOT NULL DEFAULT 'STANDARD';

COMMIT;
