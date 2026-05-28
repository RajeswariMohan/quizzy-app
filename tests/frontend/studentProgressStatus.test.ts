import { describe, expect, it } from 'vitest';
import type { StudentProgressRow } from '@/api/progress.api';
import {
  filterStudentsByProgressStatus,
  resolveStudentProgressStatus,
  sortStudentProgressRows,
} from '@/utils/studentProgressStatus';

function row(
  partial: Partial<StudentProgressRow> & Pick<StudentProgressRow, 'studentId' | 'displayName'>,
): StudentProgressRow {
  return {
    email: `${partial.studentId}@test.school`,
    grade: null,
    section: null,
    xpPoints: 0,
    currentStreak: 0,
    quizzesStarted: 0,
    quizzesCompleted: 0,
    totalAnswers: 0,
    correctAnswers: 0,
    accuracy: 0,
    totalPointsEarned: 0,
    lastActivityAt: null,
    totalActiveSeconds: 0,
    sessionCount: 0,
    lastLoginAt: null,
    ...partial,
  };
}

describe('studentProgressStatus', () => {
  describe('resolveStudentProgressStatus', () => {
    it('returns not_started when no activity', () => {
      expect(resolveStudentProgressStatus(row({ studentId: '1', displayName: 'A' }))).toBe('not_started');
    });

    it('returns in_progress when started but not all completed', () => {
      expect(
        resolveStudentProgressStatus(
          row({
            studentId: '1',
            displayName: 'A',
            quizzesStarted: 3,
            quizzesCompleted: 1,
            totalAnswers: 5,
          }),
        ),
      ).toBe('in_progress');
    });

    it('returns completed when all started quizzes are completed', () => {
      expect(
        resolveStudentProgressStatus(
          row({
            studentId: '1',
            displayName: 'A',
            quizzesStarted: 2,
            quizzesCompleted: 2,
          }),
        ),
      ).toBe('completed');
    });

    it('returns in_progress when answers exist but quizzesStarted is zero', () => {
      expect(
        resolveStudentProgressStatus(
          row({
            studentId: '1',
            displayName: 'A',
            totalAnswers: 1,
          }),
        ),
      ).toBe('in_progress');
    });
  });

  describe('filterStudentsByProgressStatus', () => {
    const students = [
      row({ studentId: '1', displayName: 'Ann', quizzesStarted: 0 }),
      row({ studentId: '2', displayName: 'Ben', quizzesStarted: 2, quizzesCompleted: 2 }),
      row({ studentId: '3', displayName: 'Cal', quizzesStarted: 2, quizzesCompleted: 1, totalAnswers: 3 }),
    ];

    it('returns all rows for filter all', () => {
      expect(filterStudentsByProgressStatus(students, 'all')).toHaveLength(3);
    });

    it('filters not_started', () => {
      const result = filterStudentsByProgressStatus(students, 'not_started');
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Ann');
    });

    it('filters completed', () => {
      const result = filterStudentsByProgressStatus(students, 'completed');
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Ben');
    });

    it('filters in_progress', () => {
      const result = filterStudentsByProgressStatus(students, 'in_progress');
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Cal');
    });
  });

  describe('sortStudentProgressRows', () => {
    const students = [
      row({ studentId: '1', displayName: 'Zoe', accuracy: 90, lastActivityAt: '2024-01-01T00:00:00Z' }),
      row({ studentId: '2', displayName: 'Amy', accuracy: 70, lastActivityAt: '2024-06-01T00:00:00Z' }),
      row({ studentId: '3', displayName: 'Bob', accuracy: 90, lastActivityAt: '2024-03-01T00:00:00Z' }),
    ];

    it('sorts by accuracy descending with name tie-break', () => {
      const sorted = sortStudentProgressRows(students, 'accuracy_desc');
      expect(sorted.map((s) => s.displayName)).toEqual(['Bob', 'Zoe', 'Amy']);
    });

    it('sorts by accuracy ascending', () => {
      const sorted = sortStudentProgressRows(students, 'accuracy_asc');
      expect(sorted[0].displayName).toBe('Amy');
    });

    it('sorts by name ascending', () => {
      const sorted = sortStudentProgressRows(students, 'name_asc');
      expect(sorted.map((s) => s.displayName)).toEqual(['Amy', 'Bob', 'Zoe']);
    });

    it('sorts by activity descending', () => {
      const sorted = sortStudentProgressRows(students, 'activity_desc');
      expect(sorted[0].displayName).toBe('Amy');
    });
  });
});
