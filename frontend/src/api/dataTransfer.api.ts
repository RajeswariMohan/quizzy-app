import { apiClient } from './client';

export interface DataImportResult {
  dryRun: boolean;
  imported: {
    schools: number;
    users: number;
    classes: number;
    quizzes: number;
    questions: number;
    parentStudentLinks: number;
    studentResponses: number;
    userFeedback: number;
    platformSettings: number;
  };
  warnings: string[];
}

export async function downloadDataBackup(schoolId?: string): Promise<void> {
  const { data } = await apiClient.get<Blob>('/admin/data/export', {
    params: schoolId ? { schoolId } : undefined,
    responseType: 'blob',
  });

  const blob = data instanceof Blob ? data : new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `quizzy-backup-${stamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function importDataBackup(
  file: File,
  dryRun = false,
): Promise<DataImportResult> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await apiClient.post<DataImportResult>(
    `/admin/data/import${dryRun ? '?dryRun=true' : ''}`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
