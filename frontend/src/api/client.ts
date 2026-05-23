import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

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

export function getAccessToken(): string | null {
  return accessToken;
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
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

export function logApiError(context: string, error: unknown): void {
  if (axios.isAxiosError(error)) {
    console.error(`[Quizzy] ${context}`, error.response?.data ?? error.message);
  } else {
    console.error(`[Quizzy] ${context}`, error);
  }
}
