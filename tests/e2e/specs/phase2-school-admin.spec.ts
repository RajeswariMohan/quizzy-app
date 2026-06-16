import { test, expect } from '@playwright/test';
import { SEEDED_USERS } from '../helpers/constants';

test.describe('School admin dashboard @phase2 @schooladmin', () => {
  test('school overview shows package tier', async ({ page }) => {
    await page.goto('/school-admin');
    await expect(page.getByRole('heading', { name: 'Test School' })).toBeVisible();
    await expect(page.getByText(/Package:/)).toBeVisible();
    await expect(page.getByText('School administration')).toBeVisible();
  });

  test('users page lists seeded accounts', async ({ page }) => {
    await page.goto('/school-admin/users');
    await page.getByRole('searchbox', { name: 'Search users' }).fill(SEEDED_USERS.teacher);
    await expect(page.getByText(SEEDED_USERS.teacher)).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search users' }).fill(SEEDED_USERS.student);
    await expect(page.getByText(SEEDED_USERS.student)).toBeVisible();
  });

  test('academics page shows grade configuration', async ({ page }) => {
    await page.goto('/school-admin/academics');
    await expect(page.getByRole('heading', { name: 'School academics' })).toBeVisible();
  });
});
