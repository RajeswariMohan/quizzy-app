# Quizzy test suite

Tests live in several places by convention:

| Type | Location | Runner |
|------|----------|--------|
| Backend unit | `backend/src/**/*.spec.ts` | Jest |
| Backend e2e | `backend/test/**/*.e2e-spec.ts` | Jest + Docker Postgres |
| Frontend unit | `tests/frontend/**/*.test.ts` | Vitest |
| UI e2e (Playwright) | `tests/e2e/specs/**/*.spec.ts` | Playwright + Docker |
| Shared helpers | `backend/test/helpers/` | — |

## Prerequisites

- **Node.js** 18+ and npm
- **Docker** (for backend e2e — starts Postgres on port **5433**)
- Optional: Redis on port **6380** for queue-related e2e (most tests work without it)

From the project root, install root test tools once:

```bash
npm install
```

Backend dependencies:

```bash
cd backend && npm install
```

Frontend dependencies (required for Playwright UI e2e):

```bash
cd frontend && npm install
npx playwright install chromium
```

## Commands (run from project root)

### Run everything (frontend unit + backend unit + backend e2e)

```bash
npm test
# or
bash tests/run-all.sh
```

### Frontend unit tests only (fast, no Docker)

```bash
npm run test:frontend
# or
bash tests/run-frontend.sh
```

Watch mode while developing:

```bash
npm run test:frontend:watch
```

### Backend unit tests only (fast, no Docker)

```bash
npm run test:backend:unit
# or
bash tests/run-backend-unit.sh
```

With coverage report in `backend/coverage/`:

```bash
npm run test:backend:unit:coverage
```

### Backend e2e tests (needs Docker)

```bash
npm run test:backend:e2e
# or
bash tests/run-backend-e2e.sh
```

### Playwright UI e2e (needs Docker + backend + frontend)

Starts Postgres/Redis, prepares seeds, boots API (`:3000`) and Vite (`:5173`), then runs browser tests.

```bash
npm run test:e2e
# or
bash tests/run-e2e.sh
```

Phase 1 only (public pages, login/RBAC, student quiz):

```bash
npm run test:e2e:phase1
```

Headed / debug UI:

```bash
npm run test:e2e:ui
```

Reset seeded student quiz answers before a manual quiz-flow rerun:

```bash
cd backend && bash scripts/reset-student-quiz-responses.sh
```

### Backend: unit + e2e (original CI script)

```bash
cd backend && npm run test:all
```

Build + full test pipeline:

```bash
cd backend && npm run test:ci
```

## Run from `backend/` only

```bash
cd backend
npm test              # unit tests
npm run test:e2e      # e2e (DB must already be prepared)
npm run test:all      # Docker DB prep + unit + e2e
```

Prepare test database without running tests:

```bash
cd backend && bash scripts/test-db-prep.sh
```

## What is covered

- **Auth & RBAC** — login, register (school picker, parent email auto-link), dev token, tenant context, permissions (happy + negative)
- **Parent linking** — student `parentEmail` at signup, parent auto-link on register, manual link disabled
- **Teacher dashboard** — full `quizSummaryList`, capped `recentQuizzes`, analytics query validation (e2e)
- **Quizzes & questions** — create, publish, delete draft questions
- **Student flow** — taking quizzes, responses
- **Feedback** — submit and admin review
- **Data backup** — export/import, scope checks
- **Frontend** — quiz list filters, analytics filter links, quiz performance table sort/filter, client pagination, student progress status, public landing copy, demo video storage (IndexedDB), role home paths, backup JSON shape validation
- **UI e2e (Playwright)** — public pages, login/logout, RBAC nav and redirects, student quiz-taking, teacher/parent/school-admin dashboards, super-admin school filter, profile and feedback forms
- **LLM / AI** — validators and mock generation

## Example output

Successful unit run:

```
PASS src/data-transfer/data-transfer.service.spec.ts
PASS src/quiz/quiz.service.spec.ts
...
Test Suites: 10 passed, 10 total
```

Successful e2e run ends with all `*.e2e-spec.ts` suites passing (including `dashboard-analytics` and expanded `auth-login`).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED` on port 5433 | Run `bash tests/run-backend-e2e.sh` or `cd backend && bash scripts/test-db-prep.sh` |
| Docker not running | Start Docker Desktop, then retry |
| Port 5433 in use | Stop other Postgres containers: `docker compose -f backend/docker-compose.test.yml down` |
| Stale seed data | `docker compose -f backend/docker-compose.test.yml down -v` then re-run e2e prep |
| Manual fresh start wiped test data | Run `cd backend && bash scripts/test-db-prep.sh` to restore fixtures (see [backend/DEV.md](../backend/DEV.md)) |
| Playwright browsers missing | `npx playwright install chromium` from project root |
| Student quiz spec fails on rerun | `cd backend && bash scripts/reset-student-quiz-responses.sh` |
| UI e2e `ECONNREFUSED` on :3000 or :5173 | Ensure ports are free; run `npm run test:e2e` (starts servers automatically) |
