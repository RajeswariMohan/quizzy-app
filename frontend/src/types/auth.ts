import type { UserProfile } from '@/types/profile';

export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

/** Same shape as GET /me and PATCH /me responses. */
export type MeResponse = UserProfile;

export interface TenantProfile {
  schoolId: string | null;
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  slug?: string;
}

export type AuthUser = MeResponse;
