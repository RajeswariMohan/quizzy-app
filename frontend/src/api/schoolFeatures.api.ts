import { apiClient } from './client';
import type { SchoolSubscriptionTier } from './admin.api';
import type { QuizAudienceScope } from '@/types/quiz';

export interface SchoolFeatures {
  subscriptionTier: SchoolSubscriptionTier;
  publishScopeGrade: boolean;
  publishScopeSchool: boolean;
  publishScopeSection: boolean;
  aiGenerationEnabled: boolean;
  teacherQuizCreationEnabled: boolean;
  studentLeaderboardEnabled: boolean;
  parentPortalEnabled: boolean;
  gamificationEnabled: boolean;
  bulkUserImportEnabled: boolean;
  allowedPublishScopes: QuizAudienceScope[];
}

export async function fetchSchoolFeatures(): Promise<SchoolFeatures> {
  const { data } = await apiClient.get<SchoolFeatures>('/school/features');
  return data;
}
