import { create } from 'zustand';
import { fetchSchoolFeatures, type SchoolFeatures } from '@/api/schoolFeatures.api';
import { logApiError } from '@/api/client';

interface SchoolFeaturesState {
  features: SchoolFeatures | null;
  isLoading: boolean;
  revision: number;
  load: () => Promise<void>;
}

export const useSchoolFeaturesStore = create<SchoolFeaturesState>((set) => ({
  features: null,
  isLoading: false,
  revision: 0,
  load: async () => {
    set({ isLoading: true });
    try {
      const features = await fetchSchoolFeatures();
      set((s) => ({ features, revision: s.revision + 1 }));
    } catch (err) {
      logApiError('Load school features failed', err);
    } finally {
      set({ isLoading: false });
    }
  },
}));

export function resetSchoolFeaturesStore(): void {
  useSchoolFeaturesStore.setState({ features: null, isLoading: false, revision: 0 });
}
