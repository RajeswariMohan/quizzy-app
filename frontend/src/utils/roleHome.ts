import type { UserRole } from '@/types/auth';

export function roleHome(role: UserRole): string {
  if (role === 'STUDENT') return '/student';
  if (role === 'PARENT') return '/parent';
  if (role === 'SUPER_ADMIN') return '/admin';
  if (role === 'SCHOOL_ADMIN') return '/school-admin';
  return '/teacher';
}
