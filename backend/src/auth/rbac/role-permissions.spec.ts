import { UserRole } from '@database/enums/user-role.enum';
import { hasPermission, Permission } from './role-permissions';

describe('role-permissions', () => {
  it('grants teachers quiz management permissions', () => {
    expect(hasPermission(UserRole.TEACHER, Permission.MANAGE_QUIZZES)).toBe(true);
    expect(hasPermission(UserRole.TEACHER, Permission.TRIGGER_AI_GENERATION)).toBe(true);
  });

  it('denies students staff permissions', () => {
    expect(hasPermission(UserRole.STUDENT, Permission.MANAGE_QUIZZES)).toBe(false);
    expect(hasPermission(UserRole.STUDENT, Permission.TAKE_QUIZ)).toBe(true);
  });

  it('grants parents child progress visibility only', () => {
    expect(hasPermission(UserRole.PARENT, Permission.VIEW_CHILD_PROGRESS)).toBe(true);
    expect(hasPermission(UserRole.PARENT, Permission.TAKE_QUIZ)).toBe(false);
  });

  it('grants super admin platform management', () => {
    expect(hasPermission(UserRole.SUPER_ADMIN, Permission.MANAGE_PLATFORM)).toBe(true);
  });
});
