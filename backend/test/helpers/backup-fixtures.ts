import { BACKUP_FORMAT_VERSION } from '../../src/data-transfer/data-transfer.types';
import { SCHOOL_ID } from './constants';

export function buildMinimalBackupBundle(overrides: Record<string, unknown> = {}) {
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    scope: { type: 'school', schoolIds: [SCHOOL_ID] },
    schools: [],
    users: [],
    classes: [],
    quizzes: [],
    questions: [],
    parentStudentLinks: [],
    studentResponses: [],
    userFeedback: [],
    platformSettings: null,
    ...overrides,
  };
}
