import { UserRole } from '@database/enums/user-role.enum';

/**
 * Coarse permissions for RBAC checks. Fine-grained rules belong in services.
 */
export enum Permission {
  MANAGE_PLATFORM = 'MANAGE_PLATFORM',
  MANAGE_SCHOOL = 'MANAGE_SCHOOL',
  MANAGE_CLASSES = 'MANAGE_CLASSES',
  MANAGE_QUIZZES = 'MANAGE_QUIZZES',
  MANAGE_QUESTIONS = 'MANAGE_QUESTIONS',
  TRIGGER_AI_GENERATION = 'TRIGGER_AI_GENERATION',
  TAKE_QUIZ = 'TAKE_QUIZ',
  VIEW_OWN_PROGRESS = 'VIEW_OWN_PROGRESS',
  VIEW_CHILD_PROGRESS = 'VIEW_CHILD_PROGRESS',
  VIEW_SCHOOL_ANALYTICS = 'VIEW_SCHOOL_ANALYTICS',
}

const ALL_TENANT_PERMISSIONS: Permission[] = [
  Permission.MANAGE_SCHOOL,
  Permission.MANAGE_CLASSES,
  Permission.MANAGE_QUIZZES,
  Permission.MANAGE_QUESTIONS,
  Permission.TRIGGER_AI_GENERATION,
  Permission.TAKE_QUIZ,
  Permission.VIEW_OWN_PROGRESS,
  Permission.VIEW_CHILD_PROGRESS,
  Permission.VIEW_SCHOOL_ANALYTICS,
];

export const ROLE_PERMISSIONS: Readonly<Record<UserRole, readonly Permission[]>> = {
  [UserRole.SUPER_ADMIN]: [Permission.MANAGE_PLATFORM, ...ALL_TENANT_PERMISSIONS],
  [UserRole.SCHOOL_ADMIN]: [
    Permission.MANAGE_SCHOOL,
    Permission.MANAGE_CLASSES,
    Permission.MANAGE_QUIZZES,
    Permission.MANAGE_QUESTIONS,
    Permission.TRIGGER_AI_GENERATION,
    Permission.VIEW_SCHOOL_ANALYTICS,
  ],
  [UserRole.TEACHER]: [
    Permission.MANAGE_CLASSES,
    Permission.MANAGE_QUIZZES,
    Permission.MANAGE_QUESTIONS,
    Permission.TRIGGER_AI_GENERATION,
    Permission.VIEW_SCHOOL_ANALYTICS,
  ],
  [UserRole.STUDENT]: [Permission.TAKE_QUIZ, Permission.VIEW_OWN_PROGRESS],
  [UserRole.PARENT]: [Permission.VIEW_CHILD_PROGRESS],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
