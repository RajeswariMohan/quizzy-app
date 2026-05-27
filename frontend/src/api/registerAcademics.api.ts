import { apiClient } from './client';
import type { SchoolAcademicOptions } from './schoolAcademics.api';

export async function fetchRegisterAcademicOptions(
  schoolId?: string,
): Promise<SchoolAcademicOptions> {
  const { data } = await apiClient.get<SchoolAcademicOptions>('/auth/register-academics', {
    params: schoolId ? { schoolId } : undefined,
  });
  return data;
}
