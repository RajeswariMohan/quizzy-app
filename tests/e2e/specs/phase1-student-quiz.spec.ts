import { test, expect } from '@playwright/test';
import {
  SEEDED_QUIZ_CORRECT_OPTIONS,
  TEST_QUIZ_ID,
  TEST_QUIZ_TITLE,
} from '../helpers/constants';
import { resetStudentQuizResponses } from '../helpers/reset-quiz';

test.describe.configure({ mode: 'serial' });

test.describe('Student quiz journey @phase1 @student', () => {
  test.beforeAll(() => {
    resetStudentQuizResponses();
  });

  test('dashboard loads with greeting and available quizzes', async ({ page }) => {
    await page.goto('/student');
    await expect(page.getByText(/Hi,/)).toBeVisible();
    await expect(page.getByTestId('student-quiz-list')).toBeVisible();
    await expect(page.getByTestId(`student-quiz-item-${TEST_QUIZ_ID}`)).toContainText(
      TEST_QUIZ_TITLE,
    );
  });

  test('can complete seeded quiz question by question', async ({ page }) => {
    await page.goto('/student');
    await page.getByTestId(`student-quiz-start-${TEST_QUIZ_ID}`).click();
    await expect(page).toHaveURL(`/student/quizzes/${TEST_QUIZ_ID}`);
    await expect(page.getByTestId('quiz-question')).toBeVisible();

    for (let i = 0; i < SEEDED_QUIZ_CORRECT_OPTIONS.length; i++) {
      const correctIndex = SEEDED_QUIZ_CORRECT_OPTIONS[i];
      const questionNumber = i + 1;

      await expect(page.getByText(new RegExp(`Question ${questionNumber} of 3`))).toBeVisible();
      await expect(page.getByTestId(`quiz-option-${correctIndex}`)).toBeEnabled();
      await page.getByTestId(`quiz-option-${correctIndex}`).click();
      await page.getByTestId('quiz-submit-answer').click();
      await expect(page.getByTestId('quiz-feedback')).toBeVisible();
      await expect(page.getByTestId('quiz-feedback')).toContainText(/Correct/i);

      if (i < SEEDED_QUIZ_CORRECT_OPTIONS.length - 1) {
        await expect(page.getByTestId('quiz-next')).toBeEnabled();
        await page.getByTestId('quiz-next').click();
      }
    }

    await page.getByTestId('quiz-next').click();
    await expect(page).toHaveURL('/student');
  });
});
