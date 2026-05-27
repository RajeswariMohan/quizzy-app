-- Parent ↔ student guardian links (tenant-scoped)

BEGIN;

CREATE TABLE parent_student_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id        UUID NOT NULL REFERENCES schools (id) ON DELETE CASCADE,
  parent_user_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  student_user_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT parent_student_links_unique UNIQUE (school_id, parent_user_id, student_user_id)
);

CREATE INDEX idx_parent_student_links_parent
  ON parent_student_links (school_id, parent_user_id)
  WHERE is_active = TRUE;

CREATE INDEX idx_parent_student_links_student
  ON parent_student_links (school_id, student_user_id)
  WHERE is_active = TRUE;

COMMIT;
