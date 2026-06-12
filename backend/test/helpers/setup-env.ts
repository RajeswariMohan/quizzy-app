/** Default env for integration / e2e runs against docker-compose.test.yml */
export function applyTestEnvironment(): void {
  process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-for-e2e-only';
  process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
  process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6380';
  process.env.DATABASE_HOST = process.env.DATABASE_HOST ?? 'localhost';
  process.env.DATABASE_PORT = process.env.DATABASE_PORT ?? '5433';
  process.env.DATABASE_USER = process.env.DATABASE_USER ?? 'quizzy';
  process.env.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD ?? 'quizzy';
  process.env.DATABASE_NAME = process.env.DATABASE_NAME ?? 'quizzy';
  process.env.DEFAULT_SCHOOL_ID =
    process.env.DEFAULT_SCHOOL_ID ?? '11111111-1111-1111-1111-111111111111';
  process.env.UNLISTED_SCHOOL_ID =
    process.env.UNLISTED_SCHOOL_ID ?? '77777777-7777-7777-7777-777777777777';
}
