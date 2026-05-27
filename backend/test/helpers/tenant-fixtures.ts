import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../../src/auth/interfaces/tenant-context.interface';
import {
  SCHOOL_ADMIN_ID,
  SCHOOL_ID,
  SUPER_ADMIN_ID,
  TEACHER_ID,
} from './constants';

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
    querySchoolIds: [SCHOOL_ID],
    actingSchoolId: null,
    ...overrides,
  };
}

export function buildSchoolAdminTenant(
  overrides: Partial<TenantContext> = {},
): TenantContext {
  return {
    userId: SCHOOL_ADMIN_ID,
    email: 'admin@test.school',
    role: UserRole.SCHOOL_ADMIN,
    schoolId: SCHOOL_ID,
    isSuperAdmin: false,
    isTenantScoped: true,
    querySchoolIds: [SCHOOL_ID],
    actingSchoolId: null,
    ...overrides,
  };
}

export function buildSuperAdminTenant(
  overrides: Partial<TenantContext> = {},
): TenantContext {
  return {
    userId: SUPER_ADMIN_ID,
    email: 'super@test.platform',
    role: UserRole.SUPER_ADMIN,
    schoolId: null,
    isSuperAdmin: true,
    isTenantScoped: false,
    querySchoolIds: [SCHOOL_ID],
    actingSchoolId: SCHOOL_ID,
    ...overrides,
  };
}
