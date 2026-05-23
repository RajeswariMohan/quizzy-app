/**
 * Issue a dev JWT for frontend login testing (same payload as TokenService.signAccessToken).
 *
 * Usage:
 *   npm run issue-token
 *   npm run issue-token -- teacher
 *   npm run issue-token -- student
 *   npm run issue-token -- admin
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { sign } from 'jsonwebtoken';
import { Client } from 'pg';

// Always use backend/.env so tokens match the running API (ignore shell JWT_SECRET).
config({ path: resolve(__dirname, '../.env'), override: true });

const USERS = {
  teacher: '22222222-2222-2222-2222-222222222222',
  student: '33333333-3333-3333-3333-333333333333',
  admin: '44444444-4444-4444-4444-444444444444',
} as const;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      'JWT_SECRET is not configured. Copy backend/.env.example to backend/.env and set JWT_SECRET.',
    );
  }
  return secret;
}

async function main() {
  const role = (process.argv[2] ?? 'teacher') as keyof typeof USERS;
  const userId = USERS[role];

  if (!userId) {
    console.error(`Unknown role. Use: ${Object.keys(USERS).join(', ')}`);
    process.exit(1);
  }

  const client = new Client({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: Number(process.env.DATABASE_PORT ?? 5432),
    user: process.env.DATABASE_USER ?? 'quizzy',
    password: process.env.DATABASE_PASSWORD ?? 'quizzy',
    database: process.env.DATABASE_NAME ?? 'quizzy',
  });

  await client.connect();

  try {
    const { rows } = await client.query<{
      id: string;
      email: string;
      role: string;
      school_id: string | null;
      is_active: boolean;
    }>(
      `SELECT u.id, u.email, u.role, u.school_id, u.is_active
       FROM users u
       WHERE u.id = $1`,
      [userId],
    );

    const user = rows[0];
    if (!user?.is_active) {
      throw new Error(`User ${userId} not found or inactive. Run database seeds first.`);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      school_id: user.school_id,
    };

    const accessToken = sign(payload, getJwtSecret(), {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    });

    console.log('\n--- Paste this into Quizzy login (token only, no "Bearer") ---\n');
    console.log(accessToken);
    console.log(`\n--- Role: ${user.role} | schoolId: ${user.school_id ?? 'null'} ---\n`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Failed to issue token. Ensure Docker Postgres is running and seeds are applied.');
  console.error(error);
  process.exit(1);
});
