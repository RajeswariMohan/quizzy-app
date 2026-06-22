-- Pending self-service signups via school join link (/join/:slug)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS signup_pending_at TIMESTAMPTZ NULL;

CREATE INDEX IF NOT EXISTS idx_users_signup_pending
  ON users (school_id, signup_pending_at)
  WHERE signup_pending_at IS NOT NULL;
