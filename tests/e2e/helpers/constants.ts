/** Stable UUIDs from database/seeds — keep in sync with backend/test/helpers/constants.ts */
export const SCHOOL_ID = '11111111-1111-1111-1111-111111111111';
export const STUDENT_ID = '33333333-3333-3333-3333-333333333333';
export const TEST_QUIZ_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

export const TEST_PASSWORD = 'TestPassword1!';

export const SEEDED_USERS = {
  teacher: 'teacher@test.school',
  student: 'student@test.school',
  parent: 'parent@test.school',
  schooladmin: 'admin@test.school',
  superadmin: 'superadmin@quizzy.platform',
} as const;

export const TEST_QUIZ_TITLE = 'Science Quiz — Photosynthesis';

/** Correct option indices per seeded question (order_index 0, 1, 2). */
export const SEEDED_QUIZ_CORRECT_OPTIONS = [1, 2, 0] as const;

export const TOKEN_KEY = 'quizzy_access_token';

export const API_BASE = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000/api';

export type DevSeedRole =
  | 'teacher'
  | 'student'
  | 'parent'
  | 'schooladmin'
  | 'superadmin';

export const DEV_ROLES: DevSeedRole[] = [
  'student',
  'teacher',
  'parent',
  'schooladmin',
  'superadmin',
];

export const ROLE_HOME: Record<DevSeedRole, string> = {
  student: '/student',
  parent: '/parent',
  schooladmin: '/school-admin',
  superadmin: '/admin',
  teacher: '/teacher',
};

/** Expected sidebar nav testids per role (desktop sidebar). */
export const EXPECTED_NAV_TESTIDS: Record<DevSeedRole, string[]> = {
  student: ['nav-student', 'nav-student-leaderboard', 'nav-feedback'],
  teacher: ['nav-teacher', 'nav-teacher-quizzes', 'nav-teacher-analytics', 'nav-progress'],
  parent: ['nav-parent', 'nav-feedback', 'nav-progress'],
  schooladmin: [
    'nav-school-admin',
    'nav-school-admin-users',
    'nav-school-admin-academics',
    'nav-teacher-quizzes',
    'nav-teacher-analytics',
    'nav-progress',
    'nav-feedback',
    'nav-school-admin-data',
  ],
  superadmin: [
    'nav-admin',
    'nav-admin-schools',
    'nav-admin-packages',
    'nav-admin-analytics',
    'nav-admin-settings',
    'nav-admin-feedback',
    'nav-admin-data',
    'nav-teacher-quizzes',
    'nav-progress',
  ],
};

/** Routes a role must not access (redirects to role home). */
export const FORBIDDEN_ROUTES: Record<DevSeedRole, string> = {
  student: '/teacher',
  teacher: '/admin',
  parent: '/teacher',
  schooladmin: '/admin',
  superadmin: '/school-admin',
};
