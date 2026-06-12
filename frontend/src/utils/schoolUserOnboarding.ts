import type { CreateSchoolUserPayload } from '@/api/schoolAdmin.api';

export type OnboardRole = CreateSchoolUserPayload['role'];

/** Column order matches signup field order: identity → role → login → parent contact → password → enrollment. */
export const USER_IMPORT_HEADERS = [
  'First Name',
  'Last Name',
  'Role',
  'Username',
  'Email',
  'Parent Email',
  'Password',
  'Grade',
  'Section',
] as const;

export const ONBOARD_ROLE_OPTIONS: OnboardRole[] = ['STUDENT', 'TEACHER', 'PARENT'];

/** Shared text-field styling for add/edit user forms (matches signup). */
export const ONBOARD_FORM_INPUT_CLASS =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

export const USERNAME_READ_ONLY_HINT = 'Username is set at account creation and cannot be changed.';

export const USERNAME_HINT =
  'Your unique login ID at this school. Use letters, numbers, dots, hyphens, or underscores (3–30 characters).';

export const PARENT_EMAIL_HINT =
  'Your parent will use this same email when they create their account.';

export const PARENT_SIGNUP_HINT =
  'Use the same email your child entered as parent contact during their signup.';

export function roleLabel(role: OnboardRole): string {
  if (role === 'STUDENT') return 'Student';
  if (role === 'TEACHER') return 'Teacher';
  return 'Parent';
}

export function bulkImportRoleRules(): { role: OnboardRole; rules: string }[] {
  return [
    {
      role: 'STUDENT',
      rules:
        'Username, Parent Email, Password, Role, Grade, and Section required. Email optional. For Class 11/12, Section may be a department (e.g. Science) or department + section (e.g. Science · A).',
    },
    {
      role: 'TEACHER',
      rules: 'Email and Password required. Leave Username, Parent Email, Grade, and Section blank.',
    },
    {
      role: 'PARENT',
      rules: 'Email and Password required. Leave Username, Parent Email, Grade, and Section blank.',
    },
  ];
}
