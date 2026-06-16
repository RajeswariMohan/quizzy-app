import { test, expect } from '@playwright/test';

test.describe('Super admin @phase3 @superadmin', () => {
  test('platform overview loads', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Platform overview' })).toBeVisible();
    await expect(page.getByText('Active schools')).toBeVisible();
  });

  test('schools page includes Test School', async ({ page }) => {
    await page.goto('/admin/schools');
    await expect(page.getByRole('heading', { name: 'Schools' })).toBeVisible();
    await page.getByRole('searchbox', { name: /Search schools/i }).fill('test-school');
    await expect(page.getByRole('main').getByText('Test School')).toBeVisible();
  });

  test('school filter scopes tenant data to selected school', async ({ page }) => {
    await page.goto('/teacher/quizzes');
    await expect(page.getByTestId('school-filter')).toBeVisible();
    await page.getByTestId('school-filter').click();
    await page.getByRole('button', { name: 'Test School test-school' }).click();
    await expect(page.getByTestId('school-filter')).toContainText('Test School');

    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: 'Student progress' })).toBeVisible();
    await expect(page.getByText('student@test.school')).toBeVisible();
  });
});

test.describe('Super admin RBAC @phase3 @schooladmin', () => {
  test('school admin cannot access platform admin routes', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/school-admin');
  });
});
