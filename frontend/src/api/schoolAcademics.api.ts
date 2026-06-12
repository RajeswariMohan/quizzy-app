import { apiClient } from './client';
import type { SchoolSubscriptionTier } from './schoolAdmin.api';

export interface SchoolAcademicOptions {
  grades: string[];
  gradeSections: Record<string, string[]>;
  sections: string[];
  subjects: string[];
  subscriptionTier: SchoolSubscriptionTier;
  board?: string | null;
  parentPortalEnabled?: boolean;
}

export async function fetchSchoolAcademicOptions(): Promise<SchoolAcademicOptions> {
  const { data } = await apiClient.get<SchoolAcademicOptions>('/school/academics');
  return data;
}
