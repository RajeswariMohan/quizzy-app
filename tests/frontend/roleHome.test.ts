import { describe, expect, it } from 'vitest';
import { roleHome } from '@/utils/roleHome';
import type { UserRole } from '@/types/auth';

describe('roleHome', () => {
  const cases: [UserRole, string][] = [
    ['STUDENT', '/student'],
    ['PARENT', '/parent'],
    ['TEACHER', '/teacher'],
    ['SCHOOL_ADMIN', '/school-admin'],
    ['SUPER_ADMIN', '/admin'],
  ];

  it.each(cases)('maps %s to %s', (role, path) => {
    expect(roleHome(role)).toBe(path);
  });
});
