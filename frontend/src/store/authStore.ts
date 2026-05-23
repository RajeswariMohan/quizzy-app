import { create } from 'zustand';
import { fetchMe } from '@/api/auth.api';
import { getAccessToken, setAccessToken, logApiError } from '@/api/client';
import type { AuthUser, TenantProfile } from '@/types/auth';

const DEFAULT_TENANT: TenantProfile = {
  schoolId: null,
  schoolName: 'Quizzy',
  logoUrl: null,
  primaryColor: '#5D5FEF',
  secondaryColor: '#7C3AED',
};

function buildTenantProfile(user: AuthUser): TenantProfile {
  return {
    schoolId: user.schoolId,
    schoolName: user.schoolId ? 'Your School' : 'Quizzy Platform',
    logoUrl: null,
    primaryColor: '#5D5FEF',
    secondaryColor: '#7C3AED',
    slug: user.schoolId ?? 'platform',
  };
}

interface AuthState {
  user: AuthUser | null;
  tenantProfile: TenantProfile;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
  setTenantBranding: (partial: Partial<TenantProfile>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenantProfile: DEFAULT_TENANT,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  initialize: async () => {
    const token = getAccessToken();
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const me = await fetchMe();
      const user: AuthUser = { ...me, displayName: me.email.split('@')[0] };
      set({
        user,
        tenantProfile: buildTenantProfile(user),
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      logApiError('Auth initialization failed', error);
      setAccessToken(null);
      set({
        user: null,
        tenantProfile: DEFAULT_TENANT,
        isAuthenticated: false,
        isLoading: false,
        error: 'Session expired. Please sign in again.',
      });
    }
  },

  loginWithToken: async (token: string) => {
    set({ isLoading: true, error: null });
    setAccessToken(token);
    try {
      const me = await fetchMe();
      const user: AuthUser = { ...me, displayName: me.email.split('@')[0] };
      set({
        user,
        tenantProfile: buildTenantProfile(user),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      logApiError('Login failed', error);
      setAccessToken(null);
      set({
        isLoading: false,
        error: 'Could not verify token with backend.',
        isAuthenticated: false,
      });
    }
  },

  logout: () => {
    setAccessToken(null);
    set({
      user: null,
      tenantProfile: DEFAULT_TENANT,
      isAuthenticated: false,
      error: null,
    });
  },

  setTenantBranding: (partial) => {
    set({ tenantProfile: { ...get().tenantProfile, ...partial } });
  },
}));
