-- Quizzy initial schema
-- Multi-tenant isolation: every tenant-scoped table includes school_id with an index.

BEGIN;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN',
  'SCHOOL_ADMIN',
  'TEACHER',
  'STUDENT',
  'PARENT'
);

CREATE TYPE quiz_status AS ENUM (
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED'
);

CREATE TYPE question_source_type AS ENUM (
  'MANUAL',
  'AI_GENERATED'
);

-- ---------------------------------------------------------------------------
-- schools (tenant root — not scoped by school_id)
-- ---------------------------------------------------------------------------
CREATE TABLE schools (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(255) NOT NULL,
  slug            VARCHAR(100) NOT NULL,
  logo_url        TEXT,
  primary_color   VARCHAR(7) NOT NULL DEFAULT '#2563EB',
  secondary_color VARCHAR(7) NOT NULL DEFAULT '#7C3AED',
  board           VARCHAR(50),
  timezone        VARCHAR(64) NOT NULL DEFAULT 'UTC',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT schools_slug_unique UNIQUE (slug),
  CONSTRAINT schools_primary_color_format CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT schools_secondary_color_format CHECK (secondary_color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_schools_is_active ON schools (is_active) WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID REFERENCES schools (id) ON DELETE CASCADE,
  email              VARCHAR(320) NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  role               user_role NOT NULL,
  first_name         VARCHAR(100) NOT NULL,
  last_name          VARCHAR(100) NOT NULL,
  display_name       VARCHAR(200),
  avatar_url         TEXT,
  xp_points          INTEGER NOT NULL DEFAULT 0,
  current_streak     INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified_at  TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_school_required_for_tenant_roles CHECK (
    role = 'SUPER_ADMIN' OR school_id IS NOT NULL
  ),
  CONSTRAINT users_super_admin_no_school CHECK (
    role <> 'SUPER_ADMIN' OR school_id IS NULL
  ),
  CONSTRAINT users_xp_non_negative CHECK (xp_points >= 0),
  CONSTRAINT users_streak_non_negative CHECK (current_streak >= 0)
);

-- Tenant-scoped email uniqueness; super admins use global email uniqueness
CREATE UNIQUE INDEX idx_users_school_email ON users (school_id, email)
  WHERE school_id IS NOT NULL;

CREATE UNIQUE INDEX idx_users_super_admin_email ON users (email)
  WHERE role = 'SUPER_ADMIN';

CREATE INDEX idx_users_school_id ON users (school_id);
CREATE INDEX idx_users_school_role ON users (school_id, role);
CREATE INDEX idx_users_school_active ON users (school_id, is_active) WHERE is_active = TRUE;

-- ---------------------------------------------------------------------------
-- classes (classrooms within a school)
-- ---------------------------------------------------------------------------
CREATE TABLE classes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id      UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  grade          VARCHAR(20) NOT NULL,
  section        VARCHAR(20),
  academic_year  VARCHAR(9) NOT NULL,
  homeroom_teacher_id UUID REFERENCES users (id) ON DELETE SET NULL,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT classes_school_name_year_unique UNIQUE (school_id, name, academic_year)
);

CREATE INDEX idx_classes_school_id ON classes (school_id);
CREATE INDEX idx_classes_school_grade ON classes (school_id, grade);
CREATE INDEX idx_classes_school_active ON classes (school_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_classes_homeroom_teacher ON classes (homeroom_teacher_id);

-- ---------------------------------------------------------------------------
-- quizzes
-- ---------------------------------------------------------------------------
CREATE TABLE quizzes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id           UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  class_id            UUID NOT NULL REFERENCES classes (id) ON DELETE CASCADE,
  created_by_user_id  UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  title               VARCHAR(255) NOT NULL,
  description         TEXT,
  status              quiz_status NOT NULL DEFAULT 'DRAFT',
  subject             VARCHAR(100),
  topic               VARCHAR(150),
  board               VARCHAR(50),
  grade               VARCHAR(20),
  time_limit_minutes  INTEGER,
  total_xp_reward     INTEGER NOT NULL DEFAULT 0,
  published_at        TIMESTAMPTZ,
  starts_at           TIMESTAMPTZ,
  ends_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT quizzes_time_limit_positive CHECK (
    time_limit_minutes IS NULL OR time_limit_minutes > 0
  ),
  CONSTRAINT quizzes_xp_non_negative CHECK (total_xp_reward >= 0),
  CONSTRAINT quizzes_schedule_valid CHECK (
    starts_at IS NULL OR ends_at IS NULL OR starts_at < ends_at
  )
);

CREATE INDEX idx_quizzes_school_id ON quizzes (school_id);
CREATE INDEX idx_quizzes_school_class ON quizzes (school_id, class_id);
CREATE INDEX idx_quizzes_school_status ON quizzes (school_id, status);
CREATE INDEX idx_quizzes_school_created_by ON quizzes (school_id, created_by_user_id);
CREATE INDEX idx_quizzes_school_published ON quizzes (school_id, published_at DESC)
  WHERE status = 'PUBLISHED';

-- ---------------------------------------------------------------------------
-- questions (hybrid manual / AI ingestion)
-- ---------------------------------------------------------------------------
CREATE TABLE questions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id               UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  quiz_id                 UUID NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  question_text           TEXT NOT NULL,
  options                 JSONB NOT NULL,
  correct_option_index    SMALLINT NOT NULL,
  explanation             TEXT,
  order_index             INTEGER NOT NULL DEFAULT 0,
  difficulty              VARCHAR(20),
  subject                 VARCHAR(100),
  topic                   VARCHAR(150),
  board                   VARCHAR(50),
  grade                   VARCHAR(20),
  points                  INTEGER NOT NULL DEFAULT 10,
  source_type             question_source_type NOT NULL DEFAULT 'MANUAL',
  ai_model_used           VARCHAR(100),
  generated_by_user_id    UUID REFERENCES users (id) ON DELETE SET NULL,
  ai_prompt_snapshot      TEXT,
  ai_generation_task_id   UUID,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT questions_options_is_array CHECK (jsonb_typeof(options) = 'array'),
  CONSTRAINT questions_options_four_choices CHECK (jsonb_array_length(options) = 4),
  CONSTRAINT questions_correct_index_range CHECK (
    correct_option_index >= 0 AND correct_option_index <= 3
  ),
  CONSTRAINT questions_points_positive CHECK (points > 0),
  CONSTRAINT questions_ai_lineage CHECK (
    source_type = 'MANUAL'
    OR (
      generated_by_user_id IS NOT NULL
      AND (ai_model_used IS NOT NULL OR ai_generation_task_id IS NOT NULL)
    )
  )
);

CREATE INDEX idx_questions_school_id ON questions (school_id);
CREATE INDEX idx_questions_school_quiz ON questions (school_id, quiz_id);
CREATE INDEX idx_questions_school_quiz_order ON questions (school_id, quiz_id, order_index);
CREATE INDEX idx_questions_school_source ON questions (school_id, source_type);
CREATE INDEX idx_questions_generated_by ON questions (school_id, generated_by_user_id)
  WHERE generated_by_user_id IS NOT NULL;
CREATE INDEX idx_questions_ai_task ON questions (ai_generation_task_id)
  WHERE ai_generation_task_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- student_responses
-- ---------------------------------------------------------------------------
CREATE TABLE student_responses (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id              UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  student_id             UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  quiz_id                UUID NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  question_id            UUID NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  selected_option_index  SMALLINT,
  is_correct             BOOLEAN NOT NULL,
  points_earned          INTEGER NOT NULL DEFAULT 0,
  time_spent_seconds     INTEGER,
  answered_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT student_responses_one_per_question UNIQUE (student_id, question_id),
  CONSTRAINT student_responses_selected_index_range CHECK (
    selected_option_index IS NULL
    OR (selected_option_index >= 0 AND selected_option_index <= 3)
  ),
  CONSTRAINT student_responses_points_non_negative CHECK (points_earned >= 0),
  CONSTRAINT student_responses_time_non_negative CHECK (
    time_spent_seconds IS NULL OR time_spent_seconds >= 0
  )
);

CREATE INDEX idx_student_responses_school_id ON student_responses (school_id);
CREATE INDEX idx_student_responses_school_student ON student_responses (school_id, student_id);
CREATE INDEX idx_student_responses_school_quiz ON student_responses (school_id, quiz_id);
CREATE INDEX idx_student_responses_school_question ON student_responses (school_id, question_id);
CREATE INDEX idx_student_responses_school_student_quiz ON student_responses (school_id, student_id, quiz_id);
CREATE INDEX idx_student_responses_answered_at ON student_responses (school_id, answered_at DESC);

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_schools_updated_at
  BEFORE UPDATE ON schools FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_quizzes_updated_at
  BEFORE UPDATE ON quizzes FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_questions_updated_at
  BEFORE UPDATE ON questions FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER trg_student_responses_updated_at
  BEFORE UPDATE ON student_responses FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

COMMIT;
