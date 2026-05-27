import { describe, expect, it } from 'vitest';
import {
  applyQuizListFilters,
  buildQuizFilterOptions,
  DEFAULT_QUIZ_LIST_FILTERS,
  filterQuizzesByStatus,
  hasActiveQuizFilters,
} from '@/utils/quizFilters';
import type { QuizSummary } from '@/types/quiz';

const sampleQuizzes: QuizSummary[] = [
  {
    id: '1',
    classId: 'c1',
    title: 'Algebra Basics',
    status: 'PUBLISHED',
    subject: 'Math',
    topic: 'Algebra',
    board: 'CBSE',
    grade: '8',
    className: '8A',
    createdAt: '2024-06-01T10:00:00.000Z',
  },
  {
    id: '2',
    classId: 'c1',
    title: 'Photosynthesis',
    status: 'DRAFT',
    subject: 'Science',
    topic: 'Biology',
    board: 'ICSE',
    grade: '9',
    className: '9B',
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: '3',
    classId: 'c2',
    title: 'World War II',
    status: 'PUBLISHED',
    subject: 'History',
    topic: 'Modern',
    board: 'CBSE',
    grade: '10',
    className: '10A',
    createdAt: '2024-12-01T10:00:00.000Z',
  },
];

describe('quizFilters', () => {
  it('buildQuizFilterOptions collects unique sorted values', () => {
    const options = buildQuizFilterOptions(sampleQuizzes);

    expect(options.subjects).toEqual(['History', 'Math', 'Science']);
    expect(options.boards).toEqual(['CBSE', 'ICSE']);
    expect(options.grades).toContain('8');
    expect(options.grades).toContain('9');
    expect(options.grades).toContain('10');
  });

  it('applyQuizListFilters filters by grade', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...DEFAULT_QUIZ_LIST_FILTERS,
      grade: '9',
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Photosynthesis');
  });

  it('hasActiveQuizFilters is false for defaults', () => {
    expect(hasActiveQuizFilters(DEFAULT_QUIZ_LIST_FILTERS)).toBe(false);
  });

  it('hasActiveQuizFilters is true when search is set', () => {
    expect(
      hasActiveQuizFilters({ ...DEFAULT_QUIZ_LIST_FILTERS, search: 'algebra' }),
    ).toBe(true);
  });

  it('filterQuizzesByStatus filters by status', () => {
    const published = filterQuizzesByStatus(sampleQuizzes, 'PUBLISHED');
    expect(published).toHaveLength(2);
    expect(published.every((q) => q.status === 'PUBLISHED')).toBe(true);
  });

  it('applyQuizListFilters filters by search term', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...DEFAULT_QUIZ_LIST_FILTERS,
      search: 'photosynthesis',
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Photosynthesis');
  });

  it('applyQuizListFilters filters by subject', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...DEFAULT_QUIZ_LIST_FILTERS,
      subject: 'Math',
    });
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('Math');
  });

  it('applyQuizListFilters sorts newest first by default', () => {
    const result = applyQuizListFilters(sampleQuizzes, DEFAULT_QUIZ_LIST_FILTERS);
    expect(result[0].id).toBe('3');
    expect(result[2].id).toBe('2');
  });

  it('applyQuizListFilters sorts oldest when requested', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...DEFAULT_QUIZ_LIST_FILTERS,
      sort: 'oldest',
    });
    expect(result[0].id).toBe('2');
    expect(result[2].id).toBe('3');
  });

  it('applyQuizListFilters sorts by title', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...DEFAULT_QUIZ_LIST_FILTERS,
      sort: 'title',
    });
    expect(result.map((q) => q.title)).toEqual([
      'Algebra Basics',
      'Photosynthesis',
      'World War II',
    ]);
  });
});
