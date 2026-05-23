import { UserRole } from '@database/enums/user-role.enum';
import {
  isSuperAdmin,
  isTenantScopedRole,
  roleRequiresSchoolId,
} from './role-groups';

describe('role-groups', () => {
  it('identifies super admin without tenant scope', () => {
    expect(isSuperAdmin(UserRole.SUPER_ADMIN)).toBe(true);
    expect(isTenantScopedRole(UserRole.SUPER_ADMIN)).toBe(false);
    expect(roleRequiresSchoolId(UserRole.SUPER_ADMIN)).toBe(false);
  });

  it('requires school_id for all tenant roles', () => {
    for (const role of [
      UserRole.SCHOOL_ADMIN,
      UserRole.TEACHER,
      UserRole.STUDENT,
      UserRole.PARENT,
    ]) {
      expect(roleRequiresSchoolId(role)).toBe(true);
      expect(isTenantScopedRole(role)).toBe(true);
    }
  });
});
