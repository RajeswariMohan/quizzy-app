# Local development

## Fresh start (super admin only)

Use this when you want to manually test onboarding from scratch — no test schools, users, or quizzes.

**What remains after reset:**

- Super admin: `superadmin@quizzy.platform` / `TestPassword1!`
- Platform unlisted school (for public student signup flow)
- Default platform feature flags and subscription packages

**What is deleted:**

- All tenant schools (Test School, schools you created, etc.)
- All teachers, students, parents, and school admins
- All quizzes, questions, responses, sessions, and feedback
- Redis AI generation queue jobs

### Run the reset

From the project root:

```bash
CONFIRM_RESET=yes npm run db:reset:superadmin
```

Or from `backend/`:

```bash
CONFIRM_RESET=yes bash scripts/reset-to-superadmin-only.sh
```

Requires Docker (Postgres on port **5433**, Redis on **6380**). For hosted Postgres (e.g. Neon), see [`NEON.md`](NEON.md).

### After reset

1. **Clear browser state** — stale JWTs cause confusing UI:
   - Log out, or open DevTools → Application → Local Storage → remove `quizzy_access_token` and `quizzy_school_filter`
   - Or visit `/login/dev` and use the Super Admin quick-login button
2. Start the API: `cd backend && npm run start:dev`
3. Start the UI: `cd frontend && npm run dev`
4. Sign in and create your first school at **Admin → Schools** (`/admin/schools`)

### Restore test data for automated tests

Playwright and backend e2e tests expect seeded fixtures:

```bash
cd backend && bash scripts/test-db-prep.sh
```

### Optional: `DEFAULT_SCHOOL_ID`

[`backend/.env`](backend/.env) may still reference the old Test School UUID. After a fresh start, create a school first; you can update `DEFAULT_SCHOOL_ID` to your new school's ID if super-admin API writes need a default tenant scope.
