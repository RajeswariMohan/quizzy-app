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
