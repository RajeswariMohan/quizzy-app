export type UserRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface MeResponse {
  userId: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  isTenantScoped: boolean;
}

export interface TenantProfile {
  schoolId: string | null;
  schoolName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  slug?: string;
}

export interface AuthUser extends MeResponse {
  displayName?: string;
}
