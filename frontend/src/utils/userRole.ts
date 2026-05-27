import type { UserRole } from '@/types/auth';

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  SCHOOL_ADMIN: 'School Admin',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent',
};

export function formatUserRole(role: string): string {
  return ROLE_LABELS[role as UserRole] ?? role.replace(/_/g, ' ').toLowerCase();
}
