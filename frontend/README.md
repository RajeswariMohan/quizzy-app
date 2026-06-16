# Quizzy Frontend

React + TypeScript + Tailwind CSS portal for students, teachers, and parents.

## Stack

- React 18 (SPA)
- TypeScript
- Tailwind CSS (tenant CSS variables)
- Lucide React icons
- Recharts analytics
- Zustand (auth + notifications)
- Axios API client with JWT interceptor

## Run

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Ensure the NestJS API runs on port 3000 (Vite proxies `/api`).

## Deploy on Vercel

1. Push this repo to GitHub (already configured as `origin`).
2. Go to [vercel.com/new](https://vercel.com/new) → **Import Git Repository** → select `quizzy-app`.
3. Set **Root Directory** to `frontend` (monorepo).
4. Vercel auto-detects **Vite**; `frontend/vercel.json` configures the SPA build.
5. Add **Environment Variable** (required for production):
   - `VITE_API_BASE_URL` = `https://your-backend-url/api` (your deployed NestJS API)
6. Deploy.

The backend must allow your Vercel domain in CORS (`FRONTEND_ORIGIN` in `backend/.env`).

## Sign in (dev)

1. Issue a token from the backend test teacher user.
2. Paste the JWT on `/login`.
3. You are routed by role: Student → `/student`, Teacher → `/teacher`, Parent → `/parent`.

## Key paths

| File | Purpose |
|------|---------|
| `src/context/ThemeContext.tsx` | Whitelabel `--color-primary` / logo |
| `src/api/client.ts` | Axios + Bearer JWT |
| `src/components/layout/DashboardLayout.tsx` | Sidebar + top bar |
| `src/pages/StudentDashboard.tsx` | Panels 5, 6, 11 |
| `src/pages/TeacherDashboard.tsx` | Panel 10 + quiz creator |
| `src/pages/ParentDashboard.tsx` | Panels 7, 9 |

## Quiz topics

See [`docs/quiz-topics.md`](../docs/quiz-topics.md) for how `quizzes.topic` is stored, set, and used in filters (subjects come from school config; topics do not).

## Backend integration

- `POST /api/quizzes/:quizId/questions/ai-generate` → 202, then poll `GET /api/ai-generation-tasks/:taskId`
- `POST /api/quizzes/:quizId/questions/manual`
- `POST /api/quizzes`, `GET /api/me`
