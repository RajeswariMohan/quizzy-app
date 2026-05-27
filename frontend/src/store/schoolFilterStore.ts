import { create } from 'zustand';
import { DEFAULT_ACTING_SCHOOL_ID } from '@/constants/tenant';
import { listSchools, type SchoolOption } from '@/api/schools.api';

const STORAGE_KEY = 'quizzy_school_filter';

export type SchoolFilterMode = 'all' | 'selected';

interface PersistedFilter {
  mode: SchoolFilterMode;
  selectedSchoolIds: string[];
}

function loadPersisted(): PersistedFilter {
  if (typeof window === 'undefined') {
    return { mode: 'all', selectedSchoolIds: [] };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedFilter;
      if (parsed.mode === 'all' || parsed.mode === 'selected') {
        return parsed;
      }
    }
    const legacy = localStorage.getItem('quizzy_acting_school_id');
    if (legacy) {
      return { mode: 'selected', selectedSchoolIds: [legacy] };
    }
  } catch {
    /* ignore */
  }
  return { mode: 'all', selectedSchoolIds: [] };
}

function savePersisted(state: PersistedFilter): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.removeItem('quizzy_acting_school_id');
}

interface SchoolFilterState {
  mode: SchoolFilterMode;
  selectedSchoolIds: string[];
  schools: SchoolOption[];
  schoolsLoaded: boolean;
  filterVersion: number;
  loadSchools: () => Promise<void>;
  setModeAll: () => void;
  setSelectedSchoolIds: (ids: string[]) => void;
  selectOnlySchool: (schoolId: string) => void;
  toggleSchool: (schoolId: string) => void;
  getApiHeaderValue: () => string;
  getFilterLabel: () => string;
}

export const useSchoolFilterStore = create<SchoolFilterState>((set, get) => {
  const initial = loadPersisted();

  return {
    mode: initial.mode,
    selectedSchoolIds:
      initial.selectedSchoolIds.length > 0
        ? initial.selectedSchoolIds
        : [DEFAULT_ACTING_SCHOOL_ID],
    schools: [],
    schoolsLoaded: false,
    filterVersion: 0,

    loadSchools: async () => {
      if (get().schoolsLoaded) return;
      const schools = await listSchools();
      set({ schools, schoolsLoaded: true });
      const { selectedSchoolIds, mode } = get();
      if (mode === 'selected' && selectedSchoolIds.length === 0 && schools.length > 0) {
        set({ selectedSchoolIds: [schools[0].id] });
        savePersisted({ mode: 'selected', selectedSchoolIds: [schools[0].id] });
      }
    },

    setModeAll: () => {
      savePersisted({ mode: 'all', selectedSchoolIds: [] });
      set({ mode: 'all', filterVersion: get().filterVersion + 1 });
    },

    setSelectedSchoolIds: (ids: string[]) => {
      const unique = [...new Set(ids)];
      savePersisted({ mode: 'selected', selectedSchoolIds: unique });
      set({
        mode: 'selected',
        selectedSchoolIds: unique,
        filterVersion: get().filterVersion + 1,
      });
    },

    selectOnlySchool: (schoolId: string) => {
      get().setSelectedSchoolIds([schoolId]);
    },

    toggleSchool: (schoolId: string) => {
      const { mode, selectedSchoolIds, schools } = get();

      if (mode === 'all') {
        get().setSelectedSchoolIds([schoolId]);
        return;
      }

      const next = selectedSchoolIds.includes(schoolId)
        ? selectedSchoolIds.filter((id) => id !== schoolId)
        : [...selectedSchoolIds, schoolId];

      if (next.length === 0) {
        get().setModeAll();
        return;
      }
      if (schools.length > 0 && next.length === schools.length) {
        get().setModeAll();
        return;
      }
      get().setSelectedSchoolIds(next);
    },

    getApiHeaderValue: () => {
      const { mode, selectedSchoolIds } = get();
      if (mode === 'all') return 'all';
      if (selectedSchoolIds.length === 0) return 'all';
      return selectedSchoolIds.join(',');
    },

    getFilterLabel: () => {
      const { mode, selectedSchoolIds, schools } = get();
      if (mode === 'all') {
        const n = schools.length;
        return n > 0 ? `All schools (${n})` : 'All schools';
      }
      if (selectedSchoolIds.length === 1) {
        const school = schools.find((s) => s.id === selectedSchoolIds[0]);
        return school?.name ?? '1 school';
      }
      return `${selectedSchoolIds.length} schools`;
    },
  };
});
