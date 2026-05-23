# Quizzy Database Layer

Initial PostgreSQL schema and TypeORM entities for the Quizzy multi-tenant platform.

## Layout

```
database/
├── migrations/
│   └── 001_initial_schema.sql   # Source of truth for DDL
├── entities/                    # NestJS / TypeORM entity classes
├── enums/                       # Shared TypeScript enums (match PG enums)
└── README.md
```

## Tables

| Table | `school_id` | Notes |
|-------|-------------|--------|
| `schools` | — | Tenant root; whitelabel fields |
| `users` | FK (nullable for `SUPER_ADMIN`) | RBAC roles, XP, streaks |
| `classes` | FK, indexed | Classrooms per school |
| `quizzes` | FK, indexed | Linked to class + creator |
| `questions` | FK, indexed | Hybrid `MANUAL` / `AI_GENERATED` lineage |
| `student_responses` | FK, indexed | One answer per student per question |
| `ai_generation_tasks` | FK, indexed | Async AI generation status + metrics (`002` migration) |

All tenant-scoped tables include a dedicated `idx_*_school_id` index plus composite indexes prefixed with `school_id` for typical multi-tenant query patterns.

## Apply migration

```bash
psql "$DATABASE_URL" -f backend/database/migrations/001_initial_schema.sql
```

Or with discrete connection params:

```bash
psql -h localhost -U quizzy -d quizzy -f backend/database/migrations/001_initial_schema.sql
```

## NestJS TypeORM registration

After installing `@nestjs/typeorm` and `typeorm`:

```typescript
import { QUIZZY_ENTITIES } from './database/entities';

TypeOrmModule.forRoot({
  type: 'postgres',
  // ...
  entities: [...QUIZZY_ENTITIES],
  synchronize: false, // always use migrations in production
});

TypeOrmModule.forFeature([...QUIZZY_ENTITIES]);
```

## Multi-tenancy

Every repository query against tenant data **must** filter by `school_id` from the authenticated JWT. See `architecture_plan.md` and `.cursorrules`.
