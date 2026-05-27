import { apiClient } from './client';
import type { MeResponse } from '@/types/auth';
import type { UserRole } from '@/types/auth';

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Extract<UserRole, 'STUDENT' | 'PARENT' | 'TEACHER'>;
  board?: string;
  grade?: string;
  subject?: string;
  /** Parent only: link to existing student at signup */
  studentEmail?: string;
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function registerAccount(payload: RegisterPayload): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/register', payload);
  return data;
}

export type DevSeedRole = 'teacher' | 'student' | 'parent' | 'schooladmin' | 'superadmin';

export async function issueDevToken(role: DevSeedRole): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/dev/token', { role });
  return data;
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/me');
  return data;
}

export async function logoutSession(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function sendSessionHeartbeat(): Promise<void> {
  await apiClient.post('/auth/session/heartbeat');
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const { data } = await apiClient.get('/health');
  return data;
}
