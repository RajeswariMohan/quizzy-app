import { describe, expect, it } from 'vitest';

/** Mirrors backend BACKUP_FORMAT_VERSION — keep in sync with data-transfer.types.ts */
const BACKUP_FORMAT_VERSION = 1;

function isValidBackupShape(data: unknown): data is {
  formatVersion: number;
  schools: unknown[];
  users: unknown[];
} {
  if (!data || typeof data !== 'object') return false;
  const bundle = data as Record<string, unknown>;
  return (
    bundle.formatVersion === BACKUP_FORMAT_VERSION &&
    Array.isArray(bundle.schools) &&
    Array.isArray(bundle.users)
  );
}

describe('backup JSON shape', () => {
  it('accepts a minimal valid backup object', () => {
    const backup = {
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      scope: { type: 'school', schoolIds: ['11111111-1111-1111-1111-111111111111'] },
      schools: [],
      users: [],
      classes: [],
      quizzes: [],
      questions: [],
      parentStudentLinks: [],
      studentResponses: [],
      userFeedback: [],
    };

    expect(isValidBackupShape(backup)).toBe(true);
  });

  it('rejects wrong format version', () => {
    expect(
      isValidBackupShape({
        formatVersion: 2,
        schools: [],
        users: [],
      }),
    ).toBe(false);
  });

  it('rejects non-object payloads', () => {
    expect(isValidBackupShape(null)).toBe(false);
    expect(isValidBackupShape('{}')).toBe(false);
  });
});
