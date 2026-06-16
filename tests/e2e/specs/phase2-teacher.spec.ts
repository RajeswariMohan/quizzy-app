import { test, expect } from '@playwright/test';
import { SEEDED_USERS, TEST_QUIZ_TITLE } from '../helpers/constants';

test.describe('Teacher dashboard @phase2 @teacher', () => {
  test('dashboard shows school stats', async ({ page }) => {
    await page.goto('/teacher');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Students')).toBeVisible();
    await expect(page.getByText('Published quizzes')).toBeVisible();
  });

  test('quizzes page lists seeded quiz and shows creator', async ({ page }) => {
    await page.goto('/teacher/quizzes');
    await expect(page.getByTestId('create-quiz-button')).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search' }).fill(TEST_QUIZ_TITLE);
    await expect(page.getByTestId('teacher-quiz-list')).toBeVisible();
    await expect(page.getByText(TEST_QUIZ_TITLE)).toBeVisible();
    await expect(page.getByPlaceholder('Quiz title')).toBeVisible();
  });

  test('analytics page renders chart sections', async ({ page }) => {
    await page.goto('/teacher/analytics');
    await expect(page.getByRole('heading', { name: 'Analytics' })).toBeVisible();
    await expect(page.getByText('Quiz performance trend')).toBeVisible();
  });

  test('progress page lists seeded student', async ({ page }) => {
    await page.goto('/progress');
    await expect(page.getByRole('heading', { name: 'Student progress' })).toBeVisible();
    await expect(page.getByText(SEEDED_USERS.student)).toBeVisible();
  });
});
