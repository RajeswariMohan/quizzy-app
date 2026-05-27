import { apiClient } from './client';

export interface SchoolOption {
  id: string;
  name: string;
  slug: string;
  primaryColor: string;
  secondaryColor: string;
}

export async function listSchools(): Promise<SchoolOption[]> {
  const { data } = await apiClient.get<SchoolOption[]>('/schools');
  return data;
}
