export const BACKUP_FORMAT_VERSION = 1;

export interface BackupScope {
  type: 'platform' | 'school';
  schoolIds: string[];
}

export interface QuizzyBackupBundle {
  formatVersion: number;
  exportedAt: string;
  scope: BackupScope;
  schools: Record<string, unknown>[];
  users: Record<string, unknown>[];
  classes: Record<string, unknown>[];
  quizzes: Record<string, unknown>[];
  questions: Record<string, unknown>[];
  parentStudentLinks: Record<string, unknown>[];
  studentResponses: Record<string, unknown>[];
  userFeedback: Record<string, unknown>[];
  platformSettings?: Record<string, unknown> | null;
}

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
