import type { Page } from '@playwright/test';
import path from 'path';
import {
  API_BASE,
  DEV_ROLES,
  ROLE_HOME,
  TOKEN_KEY,
  type DevSeedRole,
} from './constants';

export const AUTH_DIR = path.join(__dirname, '..', '.auth');

export async function fetchDevToken(role: DevSeedRole): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/dev/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dev token failed for ${role}: ${res.status} ${body}`);
  }

  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

export async function seedAuthStorage(page: Page, role: DevSeedRole): Promise<void> {
  const token = await fetchDevToken(role);
  await page.goto('/');
  await page.evaluate(
    ({ key, value }) => {
      localStorage.setItem(key, value);
    },
    { key: TOKEN_KEY, value: token },
  );
  await page.goto(ROLE_HOME[role]);
  await page.waitForLoadState('networkidle');
}

export async function writeStorageStates(): Promise<void> {
  const { chromium } = await import('@playwright/test');
  const browser = await chromium.launch();
  const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:5173';

  for (const role of DEV_ROLES) {
    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();
    await seedAuthStorage(page, role);
    await context.storageState({ path: path.join(AUTH_DIR, `${role}.json`) });
    await context.close();
  }

  await browser.close();
}
