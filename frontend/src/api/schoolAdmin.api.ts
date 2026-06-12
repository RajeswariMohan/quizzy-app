import { apiClient } from './client';

export interface SchoolUsage {
  students: number;
  teachers: number;
  parents: number;
}

export interface SchoolLimits {
  maxStudents: number | null;
  maxTeachers: number | null;
  maxParents: number | null;
  usage: SchoolUsage;
}

export interface SchoolAdminOverview {
  school: { id: string; name: string; slug: string; board: string | null };
  limits: SchoolLimits;
  publishedQuizzes: number;
  avgAccuracy: number;
}

export type SchoolUserStatusFilter = 'active' | 'inactive' | 'all';

export interface SchoolUserRow {
  id: string;
  email: string;
  username: string | null;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT' | 'SCHOOL_ADMIN';
  grade: string | null;
  section: string | null;
  parentEmail: string | null;
  signupSchoolNote: string | null;
  isActive: boolean;
  createdAt: string;
}

export type SchoolSubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface SchoolAcademicConfig {
  grades: string[];
  gradeSections: Record<string, string[]>;
  sections: string[];
  subjects: string[];
  subscriptionTier?: SchoolSubscriptionTier;
  board?: string | null;
}

export interface CreateSchoolUserPayload {
  email?: string;
  username?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'TEACHER' | 'STUDENT' | 'PARENT';
  grade?: string;
  section?: string;
  parentEmail?: string;
}

export async function fetchSchoolAdminOverview(): Promise<SchoolAdminOverview> {
  const { data } = await apiClient.get<SchoolAdminOverview>('/school-admin/overview');
  return data;
}

export async function fetchSchoolUsers(options?: {
  role?: 'TEACHER' | 'STUDENT' | 'PARENT';
  status?: SchoolUserStatusFilter;
  search?: string;
  grade?: string;
  section?: string;
}): Promise<SchoolUserRow[]> {
  const params: Record<string, string> = {};
  if (options?.role) params.role = options.role;
  if (options?.status) params.status = options.status;
  if (options?.search?.trim()) params.search = options.search.trim();
  if (options?.grade?.trim()) params.grade = options.grade.trim();
  if (options?.section?.trim()) params.section = options.section.trim();
  const { data } = await apiClient.get<SchoolUserRow[]>('/school-admin/users', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return data;
}

export async function setSchoolUserActive(
  userId: string,
  isActive: boolean,
): Promise<{ success: true; isActive: boolean }> {
  const { data } = await apiClient.patch<{ success: true; isActive: boolean }>(
    `/school-admin/users/${userId}/status`,
    { isActive },
  );
  return data;
}

export async function deleteSchoolUser(userId: string): Promise<void> {
  await apiClient.delete(`/school-admin/users/${userId}`);
}

export async function createSchoolUser(
  payload: CreateSchoolUserPayload,
): Promise<SchoolUserRow> {
  const { data } = await apiClient.post<SchoolUserRow>('/school-admin/users', payload);
  return data;
}

export interface BulkImportSchoolUsersResult {
  importedCount: number;
  users: SchoolUserRow[];
}

export async function bulkImportSchoolUsers(
  users: CreateSchoolUserPayload[],
): Promise<BulkImportSchoolUsersResult> {
  const { data } = await apiClient.post<BulkImportSchoolUsersResult>(
    '/school-admin/users/bulk',
    { users },
  );
  return data;
}

export interface UpdateSchoolUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'TEACHER' | 'STUDENT' | 'PARENT';
  grade?: string;
  section?: string;
  parentEmail?: string;
  password?: string;
}

export async function updateSchoolUser(
  userId: string,
  payload: UpdateSchoolUserPayload,
): Promise<SchoolUserRow> {
  const { data } = await apiClient.patch<SchoolUserRow>(`/school-admin/users/${userId}`, payload);
  return data;
}

export async function fetchSchoolAcademicConfig(): Promise<SchoolAcademicConfig> {
  const { data } = await apiClient.get<SchoolAcademicConfig>('/school-admin/academics');
  return data;
}

export async function updateSchoolAcademicConfig(
  payload: Pick<SchoolAcademicConfig, 'gradeSections' | 'subjects'>,
): Promise<SchoolAcademicConfig> {
  const { data } = await apiClient.patch<SchoolAcademicConfig>('/school-admin/academics', {
    gradeSections: payload.gradeSections,
    subjects: payload.subjects,
  });
  return data;
}
