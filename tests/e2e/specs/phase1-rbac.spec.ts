import { test, expect } from '@playwright/test';
import {
  DEV_ROLES,
  EXPECTED_NAV_TESTIDS,
  FORBIDDEN_ROUTES,
  ROLE_HOME,
  type DevSeedRole,
} from '../helpers/constants';

const RBAC_ROLES: { role: DevSeedRole; tag: string }[] = [
  { role: 'student', tag: '@student' },
  { role: 'teacher', tag: '@teacher' },
  { role: 'parent', tag: '@parent' },
  { role: 'schooladmin', tag: '@schooladmin' },
  { role: 'superadmin', tag: '@superadmin' },
];

for (const { role, tag } of RBAC_ROLES) {
  test.describe(`RBAC — ${role} @phase1 ${tag}`, () => {
    test('lands on role home dashboard', async ({ page }) => {
      await page.goto(ROLE_HOME[role]);
      await expect(page).toHaveURL(ROLE_HOME[role]);
    });

    test('sidebar shows only allowed navigation items', async ({ page }) => {
      await page.goto(ROLE_HOME[role]);

      const expected = EXPECTED_NAV_TESTIDS[role];
      for (const testId of expected) {
        await expect(page.getByTestId(testId).first()).toBeVisible();
      }

      const forbiddenNavIds = Object.values(EXPECTED_NAV_TESTIDS)
        .flat()
        .filter((id) => !expected.includes(id));

      for (const testId of forbiddenNavIds) {
        await expect(page.getByTestId(testId)).toHaveCount(0);
      }
    });

    test('forbidden route redirects to role home', async ({ page }) => {
      const forbidden = FORBIDDEN_ROUTES[role];
      await page.goto(forbidden);
      await expect(page).toHaveURL(ROLE_HOME[role]);
    });
  });
}

// Sanity: all roles enumerated
test('RBAC role list is complete @phase1 @anonymous', async () => {
  expect(DEV_ROLES).toHaveLength(5);
});
