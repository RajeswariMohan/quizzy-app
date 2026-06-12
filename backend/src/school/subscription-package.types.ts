import { SchoolSubscriptionTier } from '@database/enums/school-subscription-tier.enum';
import {
  SubscriptionPackageFeatures,
  SubscriptionPackageTemplates,
} from '@database/constants/subscription-packages';

export type {
  SubscriptionPackageFeatures,
  SubscriptionPackageTemplates,
} from '@database/constants/subscription-packages';
export { DEFAULT_SUBSCRIPTION_PACKAGES } from '@database/constants/subscription-packages';

export type SchoolFeatureKey = keyof SubscriptionPackageFeatures;

export const SUBSCRIPTION_PACKAGE_FEATURE_META: {
  key: SchoolFeatureKey;
  label: string;
  description: string;
}[] = [
  {
    key: 'publishScopeGrade',
    label: 'Grade-level publishing',
    description: 'Teachers can publish quizzes to selected grades.',
  },
  {
    key: 'publishScopeSchool',
    label: 'School-wide publishing',
    description: 'Teachers can publish quizzes to all students in the school.',
  },
  {
    key: 'publishScopeSection',
    label: 'Section / department publishing',
    description: 'Teachers can publish to specific sections or streams.',
  },
  {
    key: 'teacherQuizCreationEnabled',
    label: 'Quiz creation',
    description: 'Teachers can create and publish quizzes.',
  },
  {
    key: 'aiGenerationEnabled',
    label: 'AI question generation',
    description: 'Queue AI-generated MCQs for quizzes.',
  },
  {
    key: 'studentLeaderboardEnabled',
    label: 'Student leaderboard',
    description: 'Competitive rankings for students.',
  },
  {
    key: 'parentPortalEnabled',
    label: 'Parent portal',
    description: 'Parent signup and child progress views.',
  },
  {
    key: 'gamificationEnabled',
    label: 'Gamification (XP & streaks)',
    description: 'XP points and streaks on student profiles.',
  },
  {
    key: 'bulkUserImportEnabled',
    label: 'Bulk user CSV import',
    description: 'School admin can import users from spreadsheet.',
  },
];

export interface EffectiveSchoolFeatures extends SubscriptionPackageFeatures {
  subscriptionTier: SchoolSubscriptionTier;
  allowedPublishScopes: import('@database/enums/quiz-audience-scope.enum').QuizAudienceScope[];
}
