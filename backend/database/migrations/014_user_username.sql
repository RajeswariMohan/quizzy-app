-- School-scoped usernames for student login (unique per tenant)

BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(32);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_school_username
  ON users (school_id, lower(username))
  WHERE username IS NOT NULL;

COMMIT;
