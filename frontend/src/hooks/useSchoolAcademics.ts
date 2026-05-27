import { useEffect } from 'react';
import { useSchoolAcademicsStore } from '@/store/schoolAcademicsStore';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';

export interface SchoolAcademicsState {
  grades: string[];
  sections: string[];
  subjects: string[];
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

  return {
    grades: config.grades,
    sections: config.sections,
    subjects: config.subjects,
    isLoading,
    reload: () => void load(),
  };
}

/** Subscribe to revision for effects that should re-run when academics change. */
export function useSchoolAcademicsRevision(): number {
  return useSchoolAcademicsStore((s) => s.revision);
}
