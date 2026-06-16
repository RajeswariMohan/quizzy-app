import { execSync } from 'child_process';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const BACKEND = path.join(ROOT, 'backend');

export default async function globalSetup(): Promise<void> {
  console.log('==> Preparing test database for Playwright e2e...');
  execSync('bash scripts/test-db-prep.sh', {
    cwd: BACKEND,
    stdio: 'inherit',
    env: {
      ...process.env,
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-jwt-secret-for-e2e-only',
    },
  });
}
