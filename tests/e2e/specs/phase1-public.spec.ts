import { test, expect } from '@playwright/test';

test.describe('Public pages @phase1 @anonymous', () => {
  test('landing page shows hero and product name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Quizzy/i }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /Learn\. Practice\. Excel\./i })).toBeVisible();
  });

  test('can navigate to login, signup, about, and contact', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();

    await page.goto('/about');
    await expect(page.getByRole('heading', { name: /Why we built Quizzy/i })).toBeVisible();

    await page.goto('/contact');
    await expect(page.getByRole('heading', { name: /We're here to help/i })).toBeVisible();
  });

  test('unauthenticated user is redirected from protected routes', async ({ page }) => {
    await page.goto('/student');
    await expect(page).toHaveURL('/');
  });
});
