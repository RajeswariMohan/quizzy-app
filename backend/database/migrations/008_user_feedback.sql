-- User experience feedback (students, parents, school admins → super admin review)

BEGIN;

CREATE TYPE feedback_status AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

CREATE TYPE feedback_category AS ENUM (
  'GENERAL',
  'BUG',
  'FEATURE',
  'UX',
  'OTHER'
);

CREATE TABLE user_feedback (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id    UUID REFERENCES schools (id) ON DELETE SET NULL,
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role         user_role NOT NULL,
  category     feedback_category NOT NULL DEFAULT 'GENERAL',
  rating       SMALLINT,
  message      TEXT NOT NULL,
  status       feedback_status NOT NULL DEFAULT 'OPEN',
  admin_notes  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_feedback_rating_range CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  CONSTRAINT user_feedback_message_nonempty CHECK (char_length(trim(message)) > 0)
);

CREATE INDEX idx_user_feedback_status ON user_feedback (status, created_at DESC);
CREATE INDEX idx_user_feedback_school_id ON user_feedback (school_id);
CREATE INDEX idx_user_feedback_user_id ON user_feedback (user_id);

COMMIT;
