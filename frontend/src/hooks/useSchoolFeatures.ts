import { useEffect } from 'react';
import { useSchoolFeaturesStore } from '@/store/schoolFeaturesStore';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import type { SchoolFeatures } from '@/api/schoolFeatures.api';

const DEFAULT_FEATURES: SchoolFeatures = {
  subscriptionTier: 'STANDARD',
  publishScopeGrade: true,
  publishScopeSchool: true,
  publishScopeSection: false,
  aiGenerationEnabled: true,
  teacherQuizCreationEnabled: true,
  studentLeaderboardEnabled: true,
  parentPortalEnabled: true,
  gamificationEnabled: true,
  bulkUserImportEnabled: true,
  allowedPublishScopes: ['SCHOOL', 'GRADE'],
};

export function useSchoolFeatures() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const features = useSchoolFeaturesStore((s) => s.features);
  const isLoading = useSchoolFeaturesStore((s) => s.isLoading);
  const load = useSchoolFeaturesStore((s) => s.load);

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, filterVersion, load]);

  return {
    features: features ?? DEFAULT_FEATURES,
    isLoading,
    reload: () => void load(),
  };
}
