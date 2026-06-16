import { defineConfig, devices } from '@playwright/test';
import path from 'path';

// Use browsers installed under node_modules (see tests/run-e2e.sh).
process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

const AUTH_DIR = path.join(__dirname, '.auth');

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './specs',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : 4,
  reporter: isCI ? [['github'], ['list']] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  globalSetup: path.join(__dirname, 'global-setup.ts'),
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run start:dev',
      cwd: path.join(__dirname, '../../backend'),
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !isCI,
      timeout: 120_000,
      env: {
        ...process.env,
        PORT: '3000',
        NODE_ENV: 'development',
        JWT_SECRET: process.env.JWT_SECRET ?? 'test-jwt-secret-for-e2e-only',
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: '5433',
        DATABASE_USER: 'quizzy',
        DATABASE_PASSWORD: 'quizzy',
        DATABASE_NAME: 'quizzy',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6380',
      },
    },
    {
      command: 'npm run dev',
      cwd: path.join(__dirname, '../../frontend'),
      url: 'http://localhost:5173',
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'anonymous',
      dependencies: ['setup'],
      use: { ...devices['Desktop Chrome'] },
      grep: /@anonymous/,
    },
    {
      name: 'student',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'student.json'),
      },
      grep: /@student/,
    },
    {
      name: 'teacher',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'teacher.json'),
      },
      grep: /@teacher/,
    },
    {
      name: 'parent',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'parent.json'),
      },
      grep: /@parent/,
    },
    {
      name: 'schooladmin',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'schooladmin.json'),
      },
      grep: /@schooladmin/,
    },
    {
      name: 'superadmin',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(AUTH_DIR, 'superadmin.json'),
      },
      grep: /@superadmin/,
    },
  ],
});
