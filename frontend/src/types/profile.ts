import type { UserRole } from '@/types/auth';

export interface AcademicOptions {
  grades: string[];
  sections: string[];
  gradeSections?: Record<string, string[]>;
}

export interface UserProfile {
  userId: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  actingSchoolId?: string | null;
  isTenantScoped: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  grade: string | null;
  section: string | null;
  xpPoints: number;
  currentStreak: number;
  schoolName: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  createdAt: string;
  updatedAt: string;
  academicOptions: AcademicOptions | null;
  requiresPasswordSetup?: boolean;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatarUrl?: string;
  grade?: string;
  section?: string;
}

export interface ChangePasswordPayload {
  currentPassword?: string;
  newPassword: string;
}
