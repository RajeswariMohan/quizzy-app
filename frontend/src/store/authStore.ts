import { create } from 'zustand';
import {
  fetchMe,
  loginWithPassword,
  registerAccount,
  issueDevToken,
} from '@/api/auth.api';
import { endSessionOnLogout } from '@/hooks/useSessionTracker';
import type { DevSeedRole, RegisterPayload } from '@/api/auth.api';
import {
  getAccessToken,
  setAccessToken,
  logApiError,
  normalizeAccessToken,
  isValidJwtFormat,
  getApiErrorMessage,
  ensureSuperAdminActingSchool,
} from '@/api/client';
import type { AuthUser, MeResponse, TenantProfile } from '@/types/auth';

const DEFAULT_TENANT: TenantProfile = {
  schoolId: null,
  schoolName: 'Quizzy',
  logoUrl: null,
  primaryColor: '#5D5FEF',
  secondaryColor: '#7C3AED',
};

function buildTenantProfile(user: AuthUser, me?: MeResponse): TenantProfile {
  const schoolId = user.schoolId ?? null;
  return {
    schoolId,
    schoolName:
      me?.schoolName ??
      (schoolId ? 'Your School' : user.role === 'SUPER_ADMIN' ? 'Test School (admin view)' : 'Quizzy Platform'),
    logoUrl: null,
    primaryColor: me?.primaryColor ?? '#5D5FEF',
    secondaryColor: me?.secondaryColor ?? '#7C3AED',
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
  completeSession: (accessToken: string) => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  loginWithDevRole: (role: DevSeedRole) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
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
    set({ isLoading: true });
    try {
      await get().completeSession(token);
      set({ isLoading: false, isAuthenticated: true });
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

  completeSession: async (accessToken: string) => {
    setAccessToken(accessToken);
    const me = await fetchMe();
    const user: AuthUser = {
      ...me,
      displayName: me.displayName ?? me.email.split('@')[0],
    };
    if (user.role === 'SUPER_ADMIN') {
      ensureSuperAdminActingSchool();
    }
    set({
      user,
      tenantProfile: buildTenantProfile(user, me),
      isAuthenticated: true,
      error: null,
    });
  },

  loginWithCredentials: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = await loginWithPassword(email, password);
      await get().completeSession(accessToken);
      set({ isLoading: false });
    } catch (error) {
      logApiError('Login failed', error);
      setAccessToken(null);
      set({
        isLoading: false,
        error: getApiErrorMessage(error, 'Invalid email or password.'),
        isAuthenticated: false,
      });
    }
  },

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = await registerAccount(payload);
      await get().completeSession(accessToken);
      set({ isLoading: false });
    } catch (error) {
      logApiError('Registration failed', error);
      setAccessToken(null);
      set({
        isLoading: false,
        error: getApiErrorMessage(error, 'Could not create account.'),
        isAuthenticated: false,
      });
    }
  },

  loginWithToken: async (token: string) => {
    const normalized = normalizeAccessToken(token);
    if (!normalized) {
      set({ error: 'Paste a valid JWT token.', isLoading: false });
      return;
    }
    if (!isValidJwtFormat(normalized)) {
      set({
        error:
          'That does not look like a full JWT. Paste the entire token — it must start with eyJ and contain two dots.',
        isLoading: false,
      });
      return;
    }
    set({ isLoading: true, error: null });
    try {
      await get().completeSession(normalized);
      set({ isLoading: false });
    } catch (error) {
      logApiError('Login failed', error);
      setAccessToken(null);
      set({
        isLoading: false,
        error: getApiErrorMessage(
          error,
          'Could not verify token with backend. Try Quick login below instead.',
        ),
        isAuthenticated: false,
      });
    }
  },

  loginWithDevRole: async (role) => {
    set({ isLoading: true, error: null });
    try {
      const { accessToken } = await issueDevToken(role);
      await get().completeSession(accessToken);
      set({ isLoading: false });
    } catch (error) {
      logApiError('Dev login failed', error);
      setAccessToken(null);
      set({
        isLoading: false,
        error: getApiErrorMessage(
          error,
          'Dev login failed. Start the backend: cd backend && npm run start:dev',
        ),
        isAuthenticated: false,
      });
    }
  },

  logout: async () => {
    await endSessionOnLogout();
    setAccessToken(null);
    set({
      user: null,
      tenantProfile: DEFAULT_TENANT,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshProfile: async () => {
    const me = await fetchMe();
    const user: AuthUser = {
      ...me,
      displayName: me.displayName ?? me.email.split('@')[0],
    };
    set({
      user,
      tenantProfile: buildTenantProfile(user, me),
    });
  },

  setTenantBranding: (partial) => {
    set({ tenantProfile: { ...get().tenantProfile, ...partial } });
  },
}));
