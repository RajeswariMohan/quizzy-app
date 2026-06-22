import { apiClient } from './client';

export interface PendingSignupRow {
  id: string;
  email: string;
  username: string | null;
  firstName: string;
  lastName: string;
  role: 'STUDENT' | 'TEACHER';
  grade: string | null;
  section: string | null;
  parentEmail: string | null;
  signupPendingAt: string;
  createdAt: string;
}

export async function fetchPendingSignups(): Promise<PendingSignupRow[]> {
  const { data } = await apiClient.get<PendingSignupRow[]>('/teacher/pending-signups');
  return data;
}

export async function approvePendingSignup(userId: string): Promise<{ success: true }> {
  const { data } = await apiClient.patch<{ success: true }>(
    `/teacher/pending-signups/${userId}/approve`,
  );
  return data;
}
