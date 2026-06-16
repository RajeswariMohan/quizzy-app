import { test, expect } from '@playwright/test';

test.describe('Profile @phase3 @student', () => {
  test('can update display name', async ({ page }) => {
    const uniqueSuffix = Date.now();
    const newName = `E2E Student ${uniqueSuffix}`;

    await page.goto('/profile');
    await expect(page.getByTestId('profile-display-name')).toBeVisible();

    await page.getByTestId('profile-display-name').fill(newName);
    await page.getByTestId('profile-save').click();

    await page.goto('/student');
    await expect(page.getByText(newName)).toBeVisible();
  });
});

test.describe('Feedback @phase3 @student', () => {
  test('can submit feedback', async ({ page }) => {
    await page.goto('/feedback');
    await expect(page.getByTestId('feedback-form')).toBeVisible();

    await page.getByTestId('feedback-message').fill(
      'Playwright e2e feedback submission test message.',
    );
    await page.getByTestId('feedback-submit').click();

    await expect(page.getByTestId('feedback-success')).toBeVisible();
    await expect(page.getByTestId('feedback-success')).toContainText(/Thank you/i);
  });
});
