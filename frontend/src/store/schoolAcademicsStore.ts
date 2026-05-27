import { create } from 'zustand';
import {
  fetchSchoolAcademicOptions,
  type SchoolAcademicOptions,
} from '@/api/schoolAcademics.api';
import { logApiError } from '@/api/client';
import { GRADES, DEFAULT_SECTIONS, SUBJECTS } from '@/constants/academics';

const PLATFORM_DEFAULTS: SchoolAcademicOptions = {
  grades: [...GRADES],
  sections: [...DEFAULT_SECTIONS],
  subjects: [...SUBJECTS],
};

interface SchoolAcademicsStore {
  config: SchoolAcademicOptions;
  revision: number;
  isLoading: boolean;
  load: () => Promise<void>;
  /** Call after school admin saves academics so all screens refresh. */
  publish: (config: SchoolAcademicOptions) => void;
}

export const useSchoolAcademicsStore = create<SchoolAcademicsStore>((set, get) => ({
  config: PLATFORM_DEFAULTS,
  revision: 0,
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    try {
      const cfg = await fetchSchoolAcademicOptions();
      set({
        config: {
          grades: cfg.grades.length > 0 ? cfg.grades : PLATFORM_DEFAULTS.grades,
          sections: cfg.sections.length > 0 ? cfg.sections : PLATFORM_DEFAULTS.sections,
          subjects: cfg.subjects.length > 0 ? cfg.subjects : PLATFORM_DEFAULTS.subjects,
        },
        revision: get().revision + 1,
      });
    } catch (err) {
      logApiError('Load school academics failed', err);
    } finally {
      set({ isLoading: false });
    }
  },

  publish: (config) => {
    set({
      config: {
        grades: config.grades.length > 0 ? config.grades : PLATFORM_DEFAULTS.grades,
        sections: config.sections.length > 0 ? config.sections : PLATFORM_DEFAULTS.sections,
        subjects: config.subjects.length > 0 ? config.subjects : PLATFORM_DEFAULTS.subjects,
      },
      revision: get().revision + 1,
    });
  },
}));
