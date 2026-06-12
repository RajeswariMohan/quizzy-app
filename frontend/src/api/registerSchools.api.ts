import { apiClient } from './client';

export interface RegisterSchoolOption {
  id: string;
  name: string;
  board: string | null;
}

export interface RegisterSchoolsResponse {
  schools: RegisterSchoolOption[];
  otherSchoolId: string;
}

export async function fetchRegisterSchools(): Promise<RegisterSchoolsResponse> {
  const { data } = await apiClient.get<RegisterSchoolsResponse>('/auth/register-schools');
  return data;
}
