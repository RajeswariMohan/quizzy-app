import { apiClient } from './client';
import type { MeResponse } from '@/types/auth';
import type { UserRole } from '@/types/auth';

export interface AuthTokenResponse {
  accessToken: string;
  tokenType: 'Bearer';
}

export interface RegisterPayload {
  email?: string;
  username?: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Extract<UserRole, 'STUDENT' | 'PARENT' | 'TEACHER'>;
  schoolId?: string;
  schoolSlug?: string;
  board?: string;
  grade?: string;
  section?: string;
  parentEmail?: string;
  /** Student only: when school is not listed */
  signupSchoolNote?: string;
}

export interface RegisterPendingResponse {
  pendingApproval: true;
  message: string;
}

export type RegisterResponse = AuthTokenResponse | RegisterPendingResponse;

export function isRegisterPending(
  response: RegisterResponse,
): response is RegisterPendingResponse {
  return 'pendingApproval' in response && response.pendingApproval === true;
}

export interface UsernameAvailabilityResponse {
  available: boolean;
  username?: string;
  reason?: string;
}

export async function loginWithPassword(
  identifier: string,
  password: string,
): Promise<AuthTokenResponse> {
  const { data } = await apiClient.post<AuthTokenResponse>('/auth/login', {
    identifier,
    password,
  });
  return data;
}

export async function checkUsernameAvailability(
  schoolId: string,
  username: string,
): Promise<UsernameAvailabilityResponse> {
  const { data } = await apiClient.get<UsernameAvailabilityResponse>(
    '/auth/register/check-username',
    { params: { schoolId, username } },
  );
  return data;
}

export async function registerAccount(payload: RegisterPayload): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', payload);
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
