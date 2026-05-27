import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

let accessToken: string | null =
  typeof window !== 'undefined' ? localStorage.getItem('quizzy_access_token') : null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    localStorage.setItem('quizzy_access_token', token);
  } else {
    localStorage.removeItem('quizzy_access_token');
  }
}

/** @deprecated Use schoolFilterStore */
export function getActingSchoolId(): string | null {
  const state = useSchoolFilterStore.getState();
  if (state.mode === 'all') return state.schools[0]?.id ?? null;
  return state.selectedSchoolIds[0] ?? null;
}

/** @deprecated Use schoolFilterStore */
export function setActingSchoolId(_schoolId: string | null): void {
  /* handled by schoolFilterStore */
}

/** @deprecated Use schoolFilterStore defaults */
export function ensureSuperAdminActingSchool(): void {
  useSchoolFilterStore.getState().loadSchools().catch(() => undefined);
}

export function getAccessToken(): string | null {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('quizzy_access_token');
  }
  return accessToken;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (useAuthStore.getState().user?.role === 'SUPER_ADMIN') {
    config.headers['X-School-Ids'] = useSchoolFilterStore.getState().getApiHeaderValue();
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string | string[] }>) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      'An unexpected API error occurred';

    const detail = Array.isArray(message) ? message.join(', ') : String(message);

    console.error('[Quizzy API]', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: detail,
    });

    return Promise.reject(error);
  },
);

/** Strip optional "Bearer " prefix and stray whitespace from pasted tokens. */
export function normalizeAccessToken(raw: string): string {
  return raw.trim().replace(/^Bearer\s+/i, '').replace(/\s+/g, '');
}

/** JWTs are three base64url segments; header always starts with eyJ for JSON payloads. */
export function isValidJwtFormat(token: string): boolean {
  const parts = token.split('.');
  return parts.length === 3 && token.startsWith('eyJ') && parts.every((part) => part.length > 10);
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string' && msg.length > 0) return msg;
    if (error.response?.status === 401) {
      if (typeof msg === 'string' && msg.toLowerCase().includes('password')) {
        return msg;
      }
      return 'Invalid or expired access token. Use Quick login below, or re-run npm run issue-token in the same shell as the backend.';
    }
    if (error.response?.status === 403) return 'You do not have permission for this action.';
    if (!error.response) {
      return 'Cannot reach the API. Start the backend with: cd backend && npm run start:dev';
    }
    if (error.response?.status === 500) {
      return 'Server error during login. Ensure PostgreSQL is running and run: cd backend && npm run db:migrate:subjects (and db:migrate:sessions if needed).';
    }
  }
  return fallback;
}

export function logApiError(context: string, error: unknown): void {
  if (axios.isAxiosError(error)) {
    console.error(`[Quizzy] ${context}`, error.response?.data ?? error.message);
  } else {
    console.error(`[Quizzy] ${context}`, error);
  }
}
