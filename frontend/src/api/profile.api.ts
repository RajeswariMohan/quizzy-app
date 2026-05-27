import { apiClient } from './client';
import type {
  ChangePasswordPayload,
  UpdateProfilePayload,
  UserProfile,
} from '@/types/profile';

export async function fetchProfile(): Promise<UserProfile> {
  const { data } = await apiClient.get<UserProfile>('/me');
  return data;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
  const { data } = await apiClient.patch<UserProfile>('/me', payload);
  return data;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.patch('/me/password', payload);
}
