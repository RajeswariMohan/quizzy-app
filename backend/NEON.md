# Get started with Neon (PostgreSQL)

Quizzy can use [Neon](https://neon.tech) instead of local Docker Postgres. The API reads **`DATABASE_URL`** (with automatic SSL for Neon hosts).

Redis is still required only for **AI question generation** (BullMQ). For everything else, Neon + local Redis—or no Redis—is fine.

## 1. Create a Neon project

1. Sign up at [console.neon.tech](https://console.neon.tech).
2. Create a project and database (default name `neondb` is fine).
3. Open **Connect** on the project dashboard.

Copy **two** connection strings from Neon:

| Variable | Neon toggle | Hostname |
|----------|-------------|----------|
| `DATABASE_URL` (API runtime) | Connection pooling **ON** | contains `-pooler` |
| `DATABASE_URL_DIRECT` (migrations only) | Connection pooling **OFF** | no `-pooler` |

Recommended query params:

```text
?sslmode=verify-full&connect_timeout=10
```

## 2. Configure `backend/.env`

```env
# Pooled — for the running API
DATABASE_URL=postgresql://USER:PASSWORD@ep-xxx-pooler.REGION.aws.neon.tech/neondb?sslmode=verify-full&connect_timeout=10

# Direct — migrations only (npm run db:migrate:all)
DATABASE_URL_DIRECT=postgresql://USER:PASSWORD@ep-xxx.REGION.aws.neon.tech/neondb?sslmode=verify-full&connect_timeout=10

JWT_SECRET=your-long-random-secret

# Optional pool tuning (defaults shown)
DATABASE_POOL_MAX=10
DATABASE_CONNECT_TIMEOUT_MS=10000
DATABASE_IDLE_TIMEOUT_MS=30000

# Redis — still local unless you add Upstash/Redis Cloud
REDIS_URL=redis://localhost:6380
```

Comment out or remove `DATABASE_HOST`, `DATABASE_PORT`, etc. when using `DATABASE_URL` (URL wins).

TLS is enabled automatically for `.neon.tech` hosts and `sslmode=require|verify-full|verify-ca`, with certificate verification (`rejectUnauthorized: true`). Override with `DATABASE_SSL=true` or `DATABASE_SSL=false`.

**Never commit** `.env` or paste credentials in chat — rotate passwords if exposed.

## 3. Run migrations (direct connection)

From `backend/`:

```bash
npm run db:migrate:all
```

Requires `DATABASE_URL_DIRECT` (or `DATABASE_URL` if you only have one).

Or use Neon’s **SQL Editor** and run files from `database/migrations/` in numeric order (`001` … `016`).

## 4. Seed super admin (fresh database)

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f database/seeds/superadmin-only-reset.sql
```

Login: `superadmin@quizzy.platform` / `TestPassword1!`

For full test fixtures (Playwright / e2e), use local Docker instead: `bash scripts/test-db-prep.sh`.

## 5. Start the app

```bash
cd backend && npm run start:dev
cd frontend && npm run dev
```

Open [http://localhost:5173](http://localhost:5173), sign in as super admin, create your first school at **Admin → Schools**.

## Tips

- **Cold starts:** Neon may pause idle computes. First request after idle can take a few seconds; `connect_timeout=10` helps.
- **Do not commit** `.env` or connection strings.
- **Migrations:** use the **direct** URL; pooled URLs can fail for DDL in some setups.
- **Production:** keep `DATABASE_URL` on the pooled endpoint; run migrations in CI with the direct URL.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `SSL connection required` | Ensure `sslmode=require` in URL or set `DATABASE_SSL=true` |
| Migration hangs / fails on pooler | Switch to **direct** connection string |
| `relation "schools" does not exist` | Run `npm run db:migrate:all` |
| AI generation stuck | Start Redis locally or set `REDIS_URL` to a hosted Redis |
