import { useEffect, useMemo } from 'react';
import { useSchoolAcademicsStore } from '@/store/schoolAcademicsStore';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { sortAlphabetically } from '@/utils/academicOptions';

export interface SchoolAcademicsState {
  grades: string[];
  gradeSections: Record<string, string[]>;
  sections: string[];
  subjects: string[];
  board: string | null;
  subscriptionTier: import('@/api/schoolAdmin.api').SchoolSubscriptionTier;
  isLoading: boolean;
  reload: () => void;
}

/**
 * School-scoped grade, section, and subject options for the current tenant.
 * Refreshes when auth, super-admin school filter, or admin saves academics.
 */
export function useSchoolAcademics(): SchoolAcademicsState {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const config = useSchoolAcademicsStore((s) => s.config);
  const isLoading = useSchoolAcademicsStore((s) => s.isLoading);
  const load = useSchoolAcademicsStore((s) => s.load);

  useEffect(() => {
    if (!isAuthenticated) return;
    void load();
  }, [isAuthenticated, filterVersion, load]);

  const subjects = useMemo(
    () => sortAlphabetically(config.subjects),
    [config.subjects],
  );

  return {
    grades: config.grades,
    gradeSections: config.gradeSections,
    sections: config.sections,
    subjects,
    board: config.board?.trim() || null,
    subscriptionTier: config.subscriptionTier,
    isLoading,
    reload: () => void load(),
  };
}

/** Subscribe to revision for effects that should re-run when academics change. */
export function useSchoolAcademicsRevision(): number {
  return useSchoolAcademicsStore((s) => s.revision);
}
