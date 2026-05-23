import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../../src/auth/interfaces/tenant-context.interface';
import { SCHOOL_ID, TEACHER_ID } from './constants';

export function buildTeacherTenant(
  overrides: Partial<TenantContext> = {},
): TenantContext {
  return {
    userId: TEACHER_ID,
    email: 'teacher@test.school',
    role: UserRole.TEACHER,
    schoolId: SCHOOL_ID,
    isSuperAdmin: false,
    isTenantScoped: true,
    ...overrides,
  };
}
