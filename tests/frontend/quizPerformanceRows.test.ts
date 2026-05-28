import { describe, expect, it } from 'vitest';
import { filterAndSortQuizPerformanceRows } from '@/utils/quizPerformanceRows';
import type { QuizSummary } from '@/types/quiz';

function quiz(
  partial: Partial<QuizSummary> & Pick<QuizSummary, 'id' | 'title' | 'status'>,
): QuizSummary & { avgAccuracy?: number | null } {
  return {
    classId: 'c1',
    subject: 'Math',
    topic: 'General',
    board: 'CBSE',
    grade: '8',
    createdAt: '2024-01-01T00:00:00Z',
    avgAccuracy: 50,
    ...partial,
  };
}

const sample = [
  quiz({ id: '1', title: 'Alpha', status: 'PUBLISHED', avgAccuracy: 80 }),
  quiz({ id: '2', title: 'Beta', status: 'DRAFT', avgAccuracy: 40 }),
  quiz({ id: '3', title: 'Gamma', status: 'PUBLISHED', avgAccuracy: 90 }),
  quiz({ id: '4', title: 'Delta', status: 'ARCHIVED', avgAccuracy: 60 }),
];

describe('filterAndSortQuizPerformanceRows', () => {
  it('returns all quizzes when status filter is all', () => {
    expect(filterAndSortQuizPerformanceRows(sample, 'all', 'title_asc')).toHaveLength(4);
  });

  it('filters by published status', () => {
    const rows = filterAndSortQuizPerformanceRows(sample, 'PUBLISHED', 'title_asc');
    expect(rows).toHaveLength(2);
    expect(rows.every((q) => q.status === 'PUBLISHED')).toBe(true);
  });

  it('filters by draft status', () => {
    const rows = filterAndSortQuizPerformanceRows(sample, 'DRAFT', 'title_asc');
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe('Beta');
  });

  it('returns empty when no quizzes match status', () => {
    expect(filterAndSortQuizPerformanceRows([], 'PUBLISHED', 'accuracy_desc')).toEqual([]);
  });

  it('sorts by accuracy descending', () => {
    const rows = filterAndSortQuizPerformanceRows(sample, 'all', 'accuracy_desc');
    expect(rows.map((q) => q.id)).toEqual(['3', '1', '4', '2']);
  });

  it('sorts by accuracy ascending', () => {
    const rows = filterAndSortQuizPerformanceRows(sample, 'all', 'accuracy_asc');
    expect(rows[0].id).toBe('2');
    expect(rows[rows.length - 1].id).toBe('3');
  });

  it('sorts by title ascending', () => {
    const rows = filterAndSortQuizPerformanceRows(sample, 'all', 'title_asc');
    expect(rows.map((q) => q.title)).toEqual(['Alpha', 'Beta', 'Delta', 'Gamma']);
  });

  it('treats null accuracy as lowest when sorting ascending', () => {
    const rows = filterAndSortQuizPerformanceRows(
      [
        quiz({ id: 'a', title: 'A', status: 'PUBLISHED', avgAccuracy: null }),
        quiz({ id: 'b', title: 'B', status: 'PUBLISHED', avgAccuracy: 10 }),
      ],
      'all',
      'accuracy_asc',
    );
    expect(rows[0].id).toBe('a');
  });
});
