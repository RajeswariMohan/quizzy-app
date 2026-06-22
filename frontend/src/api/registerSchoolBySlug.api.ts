import { apiClient } from './client';

export interface RegisterSchoolBySlug {
  id: string;
  name: string;
  board: string | null;
  slug: string;
}

export async function fetchRegisterSchoolBySlug(
  slug: string,
): Promise<RegisterSchoolBySlug> {
  const { data } = await apiClient.get<RegisterSchoolBySlug>(
    `/auth/register-school/${encodeURIComponent(slug)}`,
  );
  return data;
}
