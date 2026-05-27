-- User login sessions for engagement analytics (all roles)

BEGIN;

CREATE TABLE user_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  school_id       UUID REFERENCES schools (id) ON DELETE CASCADE,
  role            user_role NOT NULL,
  ip_address      VARCHAR(45),
  user_agent      TEXT,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at        TIMESTAMPTZ,
  active_seconds  INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_sessions_active_seconds_nonneg CHECK (active_seconds >= 0)
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions (user_id);
CREATE INDEX idx_user_sessions_school_id ON user_sessions (school_id);
CREATE INDEX idx_user_sessions_school_started ON user_sessions (school_id, started_at DESC);
CREATE INDEX idx_user_sessions_user_started ON user_sessions (user_id, started_at DESC);
CREATE INDEX idx_user_sessions_open ON user_sessions (user_id) WHERE ended_at IS NULL;

COMMIT;
