# Deploy Quizzy API on Render

The NestJS backend runs on [Render](https://render.com) with **Neon** for Postgres and **Render Key Value** for Redis (AI queue).

Frontend: deploy `frontend/` on **Vercel** and point `VITE_API_BASE_URL` at this API.

## Option A — Blueprint (recommended)

1. [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect GitHub repo `RajeswariMohan/quizzy-app`
3. Render reads [`render.yaml`](../render.yaml) at the repo root
4. Set **secret** env vars when prompted:
   - `DATABASE_URL` — Neon **pooled** URL (`-pooler` hostname)
   - `DATABASE_URL_DIRECT` — Neon **direct** URL (migrations)
   - `FRONTEND_ORIGIN` — your Vercel URL, e.g. `https://quizzy.vercel.app`
5. Deploy

`JWT_SECRET` is auto-generated. `REDIS_URL` is wired from the `quizzy-redis` Key Value service.

## Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm run start:prod` |
| Health Check Path | `/api/health` |

## Environment variables (Render Dashboard)

| Variable | Required | Example |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Neon pooled URL |
| `DATABASE_URL_DIRECT` | Yes (migrations) | Neon direct URL |
| `JWT_SECRET` | Yes | long random string |
| `FRONTEND_ORIGIN` | Yes | `https://your-app.vercel.app` |
| `REDIS_URL` | For AI generation | From Render Key Value |
| `NODE_ENV` | Auto | `production` |
| `UNLISTED_SCHOOL_ID` | Optional | `77777777-7777-7777-7777-777777777777` |

See [`.env.example`](.env.example) and [`NEON.md`](NEON.md) for URL format.

## Database migrations (first deploy)

Before the API can serve traffic, apply migrations to Neon:

```bash
cd backend
export DATABASE_URL_DIRECT="postgresql://..."
npm run db:migrate:node
```

Seed super admin (once):

```bash
# Requires psql, or paste superadmin-only-reset.sql in Neon SQL Editor
psql "$DATABASE_URL_DIRECT" -f database/seeds/superadmin-only-reset.sql
```

**Paid Render plans:** uncomment `preDeployCommand` in `render.yaml` to run `npm run db:migrate:node` on each deploy.

## Wire Vercel frontend

After deploy, your API URL is like `https://quizzy-api.onrender.com`.

**Vercel** → Project → Environment Variables:

```env
VITE_API_BASE_URL=https://quizzy-api.onrender.com/api
```

Redeploy Vercel after changing env vars.

## CORS

`FRONTEND_ORIGIN` must match your Vercel site exactly (including `https://`). Multiple origins:

```env
FRONTEND_ORIGIN=https://quizzy.vercel.app,https://www.yourdomain.com
```

Local `localhost:5173` is allowed automatically when `NODE_ENV` is not `production`.

## Health check

```bash
curl https://quizzy-api.onrender.com/api/health
# {"status":"ok","service":"quizzy-api"}
```

## Free tier notes

- Render free web services **spin down** after idle; first request may be slow.
- Neon may **cold start**; keep `connect_timeout=10` in `DATABASE_URL`.
- Run migrations manually on free tier (no `preDeployCommand`).
