import { apiClient } from './client';
import type { MeResponse } from '@/types/auth';

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/me');
  return data;
}

export async function fetchHealth(): Promise<{ status: string; service: string }> {
  const { data } = await apiClient.get('/health');
  return data;
}
