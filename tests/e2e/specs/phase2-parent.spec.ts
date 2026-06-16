import { test, expect } from '@playwright/test';
import { SEEDED_USERS } from '../helpers/constants';

test.describe('Parent dashboard @phase2 @parent', () => {
  test('shows linked child and activity summary', async ({ page }) => {
    await page.goto('/parent');
    await expect(page.getByRole('heading', { name: 'Parent insights' })).toBeVisible();
    await expect(page.getByText(/learning journey/)).toBeVisible();
    await expect(page.getByText('Overall accuracy')).toBeVisible();
    await expect(page.getByText('Quizzes taken')).toBeVisible();
  });

  test('progress page is scoped to linked children', async ({ page }) => {
    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: 'Child progress' })).toBeVisible();
    await expect(page.getByText(SEEDED_USERS.student)).toBeVisible();
  });
});
