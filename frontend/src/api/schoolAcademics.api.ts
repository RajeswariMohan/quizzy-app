import { apiClient } from './client';

export interface SchoolAcademicOptions {
  grades: string[];
  sections: string[];
  subjects: string[];
}

export async function fetchSchoolAcademicOptions(): Promise<SchoolAcademicOptions> {
  const { data } = await apiClient.get<SchoolAcademicOptions>('/school/academics');
  return data;
}
