# Quiz topics — data model and conventions

## Product decision (2026)

**Track:** Free-text `quizzes.topic` with hygiene rules (trim/normalize, required on publish, UI guidance).

**Deferred:** School-managed `topic_options` JSONB and normalized `topics` table. Revisit when admins need a canonical curriculum catalog per grade/subject.

## Storage

| Item | Location |
|------|----------|
| Table | `quizzes` |
| Column | `topic` — `varchar(150)`, nullable |
| Entity | `backend/database/entities/quiz.entity.ts` |

There is **no** `topics` table. School academics (`schools.subject_options` JSONB) provides **grades and subjects only**, not topics.

Question rows may have their own `questions.topic`; **quiz list filters and analytics mastery use `quizzes.topic`**.

## API

Base path: `/api` (see `backend/src/main.ts`).

| Action | Method | Path | Body / query |
|--------|--------|------|----------------|
| Create quiz | POST | `/quizzes` | `topic?: string` (normalized server-side) |
| Update quiz | PATCH | `/quizzes/:quizId` | `topic?: string` |
| List quizzes (teacher) | GET | `/quizzes?dateFrom&dateTo` | Own quizzes (teachers); all school quizzes (school admin) |
| **Topic suggestions (create/edit)** | GET | `/quizzes/academic-suggestions?subject=&grade=` | Distinct `quizzes.topic` for **entire school** (all creators) |
| Analytics filters | GET | `/quizzes/dashboard/overview` | `filterOptions.topics` |
| School subjects (not topics) | GET | `/school/academics` | `subjects[]` only |

## How teachers set topics (create / edit)

1. **Subject** — full school list from `GET /school/academics`, merged with subjects on the teacher’s own quizzes (`getQuizFormSubjectOptions`).
2. **Topic** — always a **text field** with browser datalist + clickable suggestion chips.
3. **Suggestions** — `GET /quizzes/academic-suggestions` for the selected subject (optional grade): topics from **all teachers and school admins** in the tenant, plus the teacher’s own quiz list as fallback if the API fails.

Topics are **short labels** (e.g. `Photosynthesis`, `Fractions`), not quiz titles.

## How filter dropdowns get topics

**Teacher Quizzes filter bar:**

- **Subject** — school `subject_options` plus subjects on loaded quizzes (`getQuizListSubjectFilterOptions`, same merge as create/edit). Always available when a grade is selected, not only subjects from quiz history for that grade.
- **Topic** — quiz `topic` values from loaded quizzes via `getQuizListTopicFilterOptions`. Enabled after grade and subject are both chosen when quiz history exists.
- **Class / section** — filters quiz class/audience only; does not change subject options.

**Teacher Analytics:** server `loadAnalyticsFilterOptions` in `quiz.service.ts`.

## Hygiene rules (implemented)

- **Normalize** on create/update: trim, collapse whitespace; empty → `null`.
- **Publish** requires a non-empty topic (backend `BadRequestException`; frontend notification before publish).
- UI copy warns not to use the quiz title as the topic.

## Future: school topic catalog

If promoted later:

1. Add `topic_options` (or grade→subject→topics map) on `schools`.
2. Expose in `GET/PATCH /school-admin/academics` and `GET /school/academics`.
3. Validate quiz topic against allowed list; merge with quiz history in filters (`mergeAcademicOptions`).
