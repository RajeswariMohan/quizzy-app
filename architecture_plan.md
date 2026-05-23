You are an expert Principal Software Architect and Senior Full-Stack Engineer. I am building "Quizzy," a highly scalable, multi-tenant gamified quiz portal for schools, students, and parents based on a React.js frontend. 

The architecture must be entirely cloud-agnostic, containerized using Docker, and structured to prevent vendor lock-in so it can easily move between cloud providers (AWS, GCP, DigitalOcean).

I need a comprehensive, step-by-step technical plan, database schema, and project folder structure before we write the core logic.

### 1. Architectural Constraints & Stack
- Frontend: React.js (with TypeScript, Tailwind CSS, and Shadcn UI/Recharts for analytics).
- Backend:  Node.js with NestJS] using TypeScript.
- Database: PostgreSQL (Relational data, strict multi-tenancy using a 'school_id' foreign key mapping).
- Cache & Real-time: Redis for live leaderboards (Sorted Sets), user streaks, and queuing background tasks.
- Portability: All services must be decoupled. Build scripts must output Dockerfiles. Avoid cloud-specific tools. Use S3-compatible API standards for file storage.

### 2. Multi-Tenant Requirements
- The platform is a single unified portal instance hosting multiple schools.
- Strict Data Isolation: Users must only ever query records matching their allowed scope via secure JWT verification.
- Dynamic Whitelabeling: The React frontend must read the user's tenant profile on login to dynamically inject school-specific branding (logos, primary/secondary accent colors) into the global UI theme context.

### 3. Core Modules to Plan
1. User Management & Auth: RBAC (Role-Based Access Control) for 4 specific roles: Super Admin, School Admin/Teacher, Student, and Parent.
2. Hybrid Quiz & Content Engine: Must support two ingestion flows seamlessly:
   - Manual/Bulk Upload: Teachers upload questions via UI or CSV/Excel templates.
   - AI Generation Engine: Teachers input a prompt, select a Board/Grade/Subject/Topic, or paste textbook text/PDF contents, and the AI generates structured multiple-choice questions (MCQs) with options, correct answers, and explanations.
3. Gamification Engine: Tracking XP points, badges earned, and daily streaks.
4. Real-time Leaderboards: Class-level, School-level, and Global-level rankings computed via Redis.
5. Analytical Dashboards: Progress tracking metrics for teachers and actionable performance alerts for parents.

### 4. Special Technical Focus: AI Generation Workflow
- Design an asynchronous background task pattern (using Redis queues/bullmq or Celery) so that when a teacher requests 20 AI questions, the API layer immediately returns a `202 Accepted` status with a task ID. The React frontend should show a loading skeleton or progress bar while the background worker processes the LLM request.
- Ensure the backend utilizes a structured JSON output mechanism (like OpenAI Structured Outputs or Gemini Controlled Generation) to enforce a strict JSON schema. The output must reliably parse into options (A, B, C, D), identify the correct index, and provide a text explanation.
- Data Lineage: The database must track question metadata (`source_type`: 'MANUAL' vs 'AI_GENERATED', `ai_model_used`, and `generated_by_user_id`).

### 5. Deliverables Needed from You
Please provide:
1. Detailed Directory Structure: For both the `/frontend` (React portal) and `/backend` repositories adhering to a clean, modular pattern.
2. PostgreSQL Entity-Relationship Diagram (ERD) Blueprint: Write out the explicit SQL table schemas (with data types, primary keys, and foreign keys) for: `schools`, `users`, `classes`, `quizzes`, `questions` (supporting the hybrid AI/manual fields), `student_responses`, and `ai_generation_tasks`.
3. Background Worker Flow Chart/Logic: Explain how the frontend, API backend, Redis queue, and LLM gateway communicate during an AI generation request to keep the UI smooth and non-blocking.
4. Redis Data Structure Plan: Exactly how keys/values and sorted sets will be named and structured for quick leaderboard lookups.
5. Portability Strategy: Provide the standard `Dockerfile` blueprint for the React application wrapped inside an Nginx container to prove its cloud-agnostic nature.

Break down your response logically. Let's start with the database schema and project structure layout first.