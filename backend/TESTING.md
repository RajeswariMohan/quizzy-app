# Quizzy Backend — Testing Guide

## Quick start

```bash
cd backend
npm run test:all    # Docker Postgres + Redis, migrations, seeds, all tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Unit tests (`src/**/*.spec.ts`) |
| `npm run test:e2e` | Integration tests (`test/**/*.e2e-spec.ts`) |
| `npm run test:all` | Full pipeline via `scripts/test-setup.sh` |
| `npm run build` | TypeScript compile check |

## Prerequisites for e2e

- Docker with `docker-compose.test.yml` services:
  - PostgreSQL on port **5433**
  - Redis on port **6380**

## Test layout

```
src/
  auth/          role-permissions, role-groups, tenant-context, token
  llm/           structured output validator, mock LLM
  quiz/          QuizService unit tests
  question/      QuestionService unit tests
  ai-generation/ AiGenerationService unit tests

test/
  auth.e2e-spec.ts
  quiz-questions.e2e-spec.ts
  quiz-create.e2e-spec.ts
  security-and-validation.e2e-spec.ts
  build-validation.e2e-spec.ts   # full-stack smoke
  helpers/                     # shared constants, app bootstrap
```

## What is validated

- **Auth & RBAC** — JWT, roles, permissions, public routes
- **Multi-tenancy** — `school_id` scoping on services and APIs
- **Quiz module** — create + read draft quizzes
- **Question module** — manual MCQ creation
- **AI generation** — 202 enqueue, BullMQ worker, `ai_generation_tasks` metrics
- **Validation** — `class-validator` DTO rules (400 on bad input)
