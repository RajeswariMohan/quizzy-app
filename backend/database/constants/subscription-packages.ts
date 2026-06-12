import { SchoolSubscriptionTier } from '../enums/school-subscription-tier.enum';

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

export type SubscriptionPackageTemplates = Record<
  SchoolSubscriptionTier,
  SubscriptionPackageFeatures
>;

export const DEFAULT_SUBSCRIPTION_PACKAGES: SubscriptionPackageTemplates = {
  [SchoolSubscriptionTier.BASIC]: {
    publishScopeGrade: true,
    publishScopeSchool: false,
    publishScopeSection: false,
    aiGenerationEnabled: false,
    teacherQuizCreationEnabled: true,
    studentLeaderboardEnabled: false,
    parentPortalEnabled: true,
    gamificationEnabled: false,
    bulkUserImportEnabled: true,
  },
  [SchoolSubscriptionTier.STANDARD]: {
    publishScopeGrade: true,
    publishScopeSchool: true,
    publishScopeSection: false,
    aiGenerationEnabled: true,
    teacherQuizCreationEnabled: true,
    studentLeaderboardEnabled: true,
    parentPortalEnabled: true,
    gamificationEnabled: true,
    bulkUserImportEnabled: true,
  },
  [SchoolSubscriptionTier.PREMIUM]: {
    publishScopeGrade: true,
    publishScopeSchool: true,
    publishScopeSection: true,
    aiGenerationEnabled: true,
    teacherQuizCreationEnabled: true,
    studentLeaderboardEnabled: true,
    parentPortalEnabled: true,
    gamificationEnabled: true,
    bulkUserImportEnabled: true,
  },
};
