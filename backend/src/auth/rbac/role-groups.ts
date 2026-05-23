import { UserRole } from '@database/enums/user-role.enum';

/** Platform operator — cross-tenant access when explicitly allowed */
export const SUPER_ADMIN_ROLES: readonly UserRole[] = [UserRole.SUPER_ADMIN];

/** School-level administration */
export const SCHOOL_ADMIN_ROLES: readonly UserRole[] = [UserRole.SCHOOL_ADMIN];

/** Instructional staff (quiz authoring, class management) */
export const TEACHER_ROLES: readonly UserRole[] = [UserRole.TEACHER];

export const STAFF_ROLES: readonly UserRole[] = [
  UserRole.SCHOOL_ADMIN,
  UserRole.TEACHER,
];

export const LEARNER_ROLES: readonly UserRole[] = [UserRole.STUDENT];

export const GUARDIAN_ROLES: readonly UserRole[] = [UserRole.PARENT];

/** All tenant-bound roles (must carry school_id in JWT) */
export const TENANT_SCOPED_ROLES: readonly UserRole[] = [
  UserRole.SCHOOL_ADMIN,
  UserRole.TEACHER,
  UserRole.STUDENT,
  UserRole.PARENT,
];

export function isSuperAdmin(role: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN;
}

export function isTenantScopedRole(role: UserRole): boolean {
  return TENANT_SCOPED_ROLES.includes(role);
}

export function isStaffRole(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function roleRequiresSchoolId(role: UserRole): boolean {
  return isTenantScopedRole(role);
}
