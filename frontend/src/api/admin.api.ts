import { apiClient } from './client';

export interface PlatformFeatures {
  aiGenerationEnabled: boolean;
  studentLeaderboardEnabled: boolean;
  parentPortalEnabled: boolean;
  teacherQuizCreationEnabled: boolean;
  gamificationEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
}

export interface SchoolLimits {
  maxStudents: number | null;
  maxTeachers: number | null;
  maxParents: number | null;
}

export type AdminSchoolsStatusFilter = 'active' | 'inactive' | 'all';

export type SchoolSubscriptionTier = 'BASIC' | 'STANDARD' | 'PREMIUM';

export interface SubscriptionPackageFeatures {
  publishScopeGrade: boolean;
  publishScopeSchool: boolean;
  publishScopeSection: boolean;
  aiGenerationEnabled: boolean;
  teacherQuizCreationEnabled: boolean;
  studentLeaderboardEnabled: boolean;
  parentPortalEnabled: boolean;
  gamificationEnabled: boolean;
  bulkUserImportEnabled: boolean;
}

export interface SubscriptionPackageFeatureMeta {
  key: keyof SubscriptionPackageFeatures;
  label: string;
  description: string;
}

export interface SubscriptionPackagesResponse {
  templates: Record<SchoolSubscriptionTier, SubscriptionPackageFeatures>;
  features: SubscriptionPackageFeatureMeta[];
}

export interface SchoolPlatformStats {
  id: string;
  name: string;
  slug: string;
  board: string | null;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  subscriptionTier: SchoolSubscriptionTier;
  students: number;
  teachers: number;
  parents: number;
  publishedQuizzes: number;
  avgAccuracy: number;
  limits?: SchoolLimits;
  usage?: { students: number; teachers: number; parents: number };
}

export interface PlatformOverview {
  settings: PlatformFeatures & { updatedAt?: string | null };
  schoolsStatus?: AdminSchoolsStatusFilter;
  totals: {
    activeSchools: number;
    inactiveSchools?: number;
    students: number;
    teachers: number;
    parents: number;
    publishedQuizzes: number;
    platformAvgAccuracy: number;
  };
  schools: SchoolPlatformStats[];
}

export async function fetchPlatformOverview(options?: {
  schoolsStatus?: AdminSchoolsStatusFilter;
}): Promise<PlatformOverview> {
  const params: Record<string, string> = {};
  if (options?.schoolsStatus) params.schoolsStatus = options.schoolsStatus;
  const { data } = await apiClient.get<PlatformOverview>('/admin/overview', {
    params: Object.keys(params).length > 0 ? params : undefined,
  });
  return data;
}

export async function fetchSchoolAnalytics(): Promise<{
  schools: SchoolPlatformStats[];
  totals: PlatformOverview['totals'];
}> {
  const { data } = await apiClient.get('/admin/analytics/schools');
  return data;
}

export async function fetchPlatformSettings(): Promise<
  PlatformFeatures & { updatedAt: string | null }
> {
  const { data } = await apiClient.get('/admin/settings');
  return data;
}

export async function updatePlatformSettings(
  patch: Partial<PlatformFeatures>,
): Promise<PlatformFeatures & { updatedAt: string }> {
  const { data } = await apiClient.patch('/admin/settings', patch);
  return data;
}

export async function fetchSubscriptionPackages(): Promise<SubscriptionPackagesResponse> {
  const { data } = await apiClient.get<SubscriptionPackagesResponse>('/admin/subscription-packages');
  return data;
}

export async function updateSubscriptionPackages(
  templates: Record<SchoolSubscriptionTier, SubscriptionPackageFeatures>,
): Promise<Record<SchoolSubscriptionTier, SubscriptionPackageFeatures>> {
  const { data } = await apiClient.patch<
    Record<SchoolSubscriptionTier, SubscriptionPackageFeatures>
  >('/admin/subscription-packages', templates);
  return data;
}

export async function fetchPlatformFeatures(): Promise<PlatformFeatures> {
  const { data } = await apiClient.get<PlatformFeatures>('/platform/features');
  return data;
}

export interface CreateSchoolPayload {
  name: string;
  slug: string;
  board?: string;
  primaryColor?: string;
  secondaryColor?: string;
  maxStudents?: number;
  maxTeachers?: number;
  maxParents?: number;
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  subscriptionTier?: SchoolSubscriptionTier;
}

export interface UpdateSchoolPayload {
  name?: string;
  board?: string | null;
  primaryColor?: string;
  secondaryColor?: string;
  isActive?: boolean;
  maxStudents?: number | null;
  maxTeachers?: number | null;
  maxParents?: number | null;
  subscriptionTier?: SchoolSubscriptionTier;
}

export async function createSchool(payload: CreateSchoolPayload): Promise<SchoolPlatformStats> {
  const { data } = await apiClient.post<SchoolPlatformStats>('/admin/schools', payload);
  return data;
}

export async function updateSchool(
  schoolId: string,
  payload: UpdateSchoolPayload,
): Promise<SchoolPlatformStats> {
  const { data } = await apiClient.patch<SchoolPlatformStats>(
    `/admin/schools/${schoolId}`,
    payload,
  );
  return data;
}

export interface SchoolAdminRow {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateSchoolAdminPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export async function fetchSchoolAdmins(schoolId: string): Promise<SchoolAdminRow[]> {
  const { data } = await apiClient.get<SchoolAdminRow[]>(`/admin/schools/${schoolId}/admins`);
  return data;
}

export async function createSchoolAdmin(
  schoolId: string,
  payload: CreateSchoolAdminPayload,
): Promise<SchoolAdminRow> {
  const { data } = await apiClient.post<SchoolAdminRow>(
    `/admin/schools/${schoolId}/admins`,
    payload,
  );
  return data;
}

export async function updateSchoolAdmin(
  schoolId: string,
  userId: string,
  payload: { firstName?: string; lastName?: string; isActive?: boolean },
): Promise<SchoolAdminRow> {
  const { data } = await apiClient.patch<SchoolAdminRow>(
    `/admin/schools/${schoolId}/admins/${userId}`,
    payload,
  );
  return data;
}
