import { test, expect } from '@playwright/test';
import { SEEDED_USERS, TEST_PASSWORD } from '../helpers/constants';
import { seedAuthStorage } from '../helpers/api-auth';

test.describe('Authentication @phase1 @anonymous', () => {
  test('UI login succeeds for seeded student', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email or username').fill(SEEDED_USERS.student);
    await page.locator('#login-password').fill(TEST_PASSWORD);
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/student');
    await expect(page.getByText(/Hi,/)).toBeVisible();
  });

  test('UI login shows error for invalid password', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email or username').fill(SEEDED_USERS.student);
    await page.locator('#login-password').fill('WrongPassword1!');
    await page.getByTestId('login-submit').click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByRole('alert')).toBeVisible();
  });

  test('logout ends session and blocks protected routes', async ({ page }) => {
    await seedAuthStorage(page, 'student');
    await expect(page).toHaveURL('/student');

    await page.getByTestId('logout-button').first().click();
    await expect(page).toHaveURL('/login');

    await page.goto('/student');
    await expect(page).toHaveURL('/');
  });
});
