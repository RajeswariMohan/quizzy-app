-- AI generation task tracking (async BullMQ workflow)

BEGIN;

CREATE TYPE ai_generation_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED'
);

CREATE TABLE ai_generation_tasks (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id             UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  quiz_id               UUID NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  requested_by_user_id  UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  status                ai_generation_status NOT NULL DEFAULT 'PENDING',
  prompt                TEXT NOT NULL,
  board                 VARCHAR(50),
  grade                 VARCHAR(20),
  subject               VARCHAR(100),
  topic                 VARCHAR(150),
  source_text           TEXT,
  requested_count       INTEGER NOT NULL,
  completed_count       INTEGER NOT NULL DEFAULT 0,
  failed_count          INTEGER NOT NULL DEFAULT 0,
  ai_model_used         VARCHAR(100),
  bull_job_id           VARCHAR(100),
  error_message         TEXT,
  metrics               JSONB NOT NULL DEFAULT '{}',
  started_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ai_generation_tasks_requested_count_positive CHECK (requested_count > 0),
  CONSTRAINT ai_generation_tasks_completed_non_negative CHECK (completed_count >= 0),
  CONSTRAINT ai_generation_tasks_failed_non_negative CHECK (failed_count >= 0)
);

CREATE INDEX idx_ai_generation_tasks_school_id ON ai_generation_tasks (school_id);
CREATE INDEX idx_ai_generation_tasks_school_quiz ON ai_generation_tasks (school_id, quiz_id);
CREATE INDEX idx_ai_generation_tasks_school_status ON ai_generation_tasks (school_id, status);
CREATE INDEX idx_ai_generation_tasks_school_requester ON ai_generation_tasks (school_id, requested_by_user_id);

ALTER TABLE questions
  ADD CONSTRAINT questions_ai_generation_task_fk
  FOREIGN KEY (ai_generation_task_id) REFERENCES ai_generation_tasks (id) ON DELETE SET NULL;

CREATE TRIGGER trg_ai_generation_tasks_updated_at
  BEFORE UPDATE ON ai_generation_tasks FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

COMMIT;
