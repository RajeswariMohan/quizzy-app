import { describe, expect, it } from 'vitest';
import {
  applyQuizListFilters,
  applyQuizListGradeChange,
  buildDefaultQuizListFilters,
  buildQuizAcademicLinks,
  buildQuizFilterOptions,
  buildQuizTopicLinks,
  coerceSubjectForGrade,
  coerceTopicForGradeSubject,
  DEFAULT_QUIZ_LIST_FILTERS,
  filterQuizzesByStatus,
  getLinkedQuizFilterValues,
  getLinkedSubjectOptions,
  getLinkedTopicOptions,
  getQuizFormSubjectOptions,
  getQuizListSubjectFilterOptions,
  getQuizListTopicFilterOptions,
  hasActiveQuizFilters,
  mergeQuizFormTopicSuggestions,
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

const wideDateFilters = {
  ...DEFAULT_QUIZ_LIST_FILTERS,
  dateFrom: '2020-01-01',
  dateTo: '2030-12-31',
};

describe('quizFilters', () => {
  it('buildQuizFilterOptions collects unique sorted values', () => {
    const options = buildQuizFilterOptions(sampleQuizzes);

    expect(options.subjects).toEqual(['History', 'Math', 'Science']);
    expect(options.grades).toContain('8');
    expect(options.grades).toContain('9');
    expect(options.grades).toContain('10');
  });

  it('applyQuizListFilters filters by status', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...wideDateFilters,
      status: 'DRAFT',
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Photosynthesis');
  });

  it('hasActiveQuizFilters is true when status is set', () => {
    expect(
      hasActiveQuizFilters({ ...DEFAULT_QUIZ_LIST_FILTERS, status: 'DRAFT' }),
    ).toBe(true);
  });

  it('applyQuizListFilters filters by grade', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...wideDateFilters,
      grade: '9',
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Photosynthesis');
  });

  it('hasActiveQuizFilters is false for defaults', () => {
    expect(hasActiveQuizFilters(DEFAULT_QUIZ_LIST_FILTERS)).toBe(false);
  });

  it('hasActiveQuizFilters is true when date range changes', () => {
    expect(
      hasActiveQuizFilters({
        ...DEFAULT_QUIZ_LIST_FILTERS,
        dateFrom: '2020-01-01',
      }),
    ).toBe(true);
  });

  it('hasActiveQuizFilters is true when search is set', () => {
    expect(
      hasActiveQuizFilters({ ...DEFAULT_QUIZ_LIST_FILTERS, search: 'algebra' }),
    ).toBe(true);
  });

  it('buildDefaultQuizListFilters spans about one year', () => {
    const filters = buildDefaultQuizListFilters();
    const from = new Date(`${filters.dateFrom}T12:00:00`);
    const to = new Date(`${filters.dateTo}T12:00:00`);
    const days = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(days).toBeGreaterThanOrEqual(364);
    expect(days).toBeLessThanOrEqual(366);
  });

  it('filterQuizzesByStatus filters by status', () => {
    const published = filterQuizzesByStatus(sampleQuizzes, 'PUBLISHED');
    expect(published).toHaveLength(2);
    expect(published.every((q) => q.status === 'PUBLISHED')).toBe(true);
  });

  it('applyQuizListFilters filters by search term', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...wideDateFilters,
      search: 'photosynthesis',
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Photosynthesis');
  });

  it('applyQuizListFilters filters by subject', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...wideDateFilters,
      subject: 'Math',
    });
    expect(result).toHaveLength(1);
    expect(result[0].subject).toBe('Math');
  });

  it('applyQuizListFilters sorts newest first by default', () => {
    const result = applyQuizListFilters(sampleQuizzes, wideDateFilters);
    expect(result[0].id).toBe('3');
    expect(result[2].id).toBe('2');
  });

  it('applyQuizListFilters sorts oldest when requested', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...wideDateFilters,
      sort: 'oldest',
    });
    expect(result[0].id).toBe('2');
    expect(result[2].id).toBe('3');
  });

  it('applyQuizListFilters sorts by title', () => {
    const result = applyQuizListFilters(sampleQuizzes, {
      ...wideDateFilters,
      sort: 'title',
    });
    expect(result.map((q) => q.title)).toEqual([
      'Algebra Basics',
      'Photosynthesis',
      'World War II',
    ]);
  });

  it('buildQuizTopicLinks dedupes grade subject topic tuples', () => {
    const links = buildQuizTopicLinks(sampleQuizzes);
    expect(links).toHaveLength(3);
    expect(links.some((l) => l.grade === '8' && l.subject === 'Math' && l.topic === 'Algebra')).toBe(
      true,
    );
  });

  it('getLinkedTopicOptions narrows by grade and subject', () => {
    const links = buildQuizTopicLinks(sampleQuizzes);
    expect(getLinkedTopicOptions(links, '8', 'Math')).toEqual(['Algebra']);
    expect(getLinkedTopicOptions(links, '9', 'Science')).toEqual(['Biology']);
    expect(getLinkedTopicOptions(links, '8', '')).toEqual(['Algebra']);
    expect(getLinkedTopicOptions(links, '', 'Science')).toEqual(['Biology']);
  });

  it('coerceTopicForGradeSubject clears topic outside linked pool', () => {
    const links = buildQuizTopicLinks(sampleQuizzes);
    expect(coerceTopicForGradeSubject('Algebra', links, '9', 'Science')).toBe('');
    expect(coerceTopicForGradeSubject('Biology', links, '9', 'Science')).toBe('Biology');
  });

  it('getLinkedTopicOptions keeps current topic when not in pool', () => {
    const links = buildQuizTopicLinks(sampleQuizzes);
    expect(getLinkedTopicOptions(links, '8', 'Math', 'Custom unit')).toEqual([
      'Custom unit',
      'Algebra',
    ]);
  });

  it('getLinkedSubjectOptions returns only subjects for the selected grade', () => {
    const links = buildQuizAcademicLinks(sampleQuizzes);
    expect(getLinkedSubjectOptions(links, '8')).toEqual(['Math']);
    expect(getLinkedSubjectOptions(links, '9')).toEqual(['Science']);
    expect(getLinkedSubjectOptions(links, '10')).toEqual(['History']);
    expect(getLinkedSubjectOptions(links, '7')).toEqual([]);
  });

  it('coerceSubjectForGrade clears subject outside linked pool for grade', () => {
    const links = buildQuizAcademicLinks(sampleQuizzes);
    expect(coerceSubjectForGrade('Math', links, '9')).toBe('');
    expect(coerceSubjectForGrade('Science', links, '9')).toBe('Science');
    expect(coerceSubjectForGrade('Math', links, '8')).toBe('Math');
  });

  it('getLinkedQuizFilterValues narrows subjects and topics by grade and subject', () => {
    const links = buildQuizAcademicLinks(sampleQuizzes);
    const fallback = { grades: [], subjects: [], topics: [] };

    const byGrade = getLinkedQuizFilterValues(links, '8', 'All', fallback);
    expect(byGrade.subjects).toEqual(['Math']);
    expect(byGrade.topics).toEqual(['Algebra']);

    const byGradeSubject = getLinkedQuizFilterValues(links, '8', 'Math', fallback);
    expect(byGradeSubject.subjects).toEqual(['Math']);
    expect(byGradeSubject.topics).toEqual(['Algebra']);

    const wrongSubject = getLinkedQuizFilterValues(links, '8', 'Science', fallback);
    expect(wrongSubject.topics).toEqual([]);
  });

  it('getQuizListSubjectFilterOptions keeps full school list when grade has no quiz history', () => {
    const links = buildQuizAcademicLinks(sampleQuizzes);
    const school = ['Computer Science', 'English', 'EVS', 'Hindi', 'test_subject'];
    const forGrade7 = getQuizListSubjectFilterOptions(links, '7', 'All', school);
    expect(forGrade7).toEqual(
      expect.arrayContaining(['Computer Science', 'English', 'EVS', 'Hindi', 'test_subject']),
    );
    const forGrade8 = getQuizListSubjectFilterOptions(links, '8', 'All', school);
    expect(forGrade8).toContain('Math');
    expect(forGrade8).toContain('English');
    expect(forGrade8).toContain('Computer Science');
  });

  it('applyQuizListGradeChange keeps subject when still in school fallback pool', () => {
    const links = buildQuizAcademicLinks(sampleQuizzes);
    const school = ['Computer Science', 'English', 'Math', 'Science'];
    const next = applyQuizListGradeChange(
      {
        ...DEFAULT_QUIZ_LIST_FILTERS,
        grade: 'All',
        subject: 'English',
        topic: 'All',
      },
      '8',
      links,
      [],
      school,
    );
    expect(next.subject).toBe('English');
    expect(next.grade).toBe('8');
  });

  it('getQuizListTopicFilterOptions requires grade and subject when links exist', () => {
    const links = buildQuizAcademicLinks(sampleQuizzes);
    expect(getQuizListTopicFilterOptions(links, 'All', 'All', ['Noise'])).toEqual([]);
    expect(getQuizListTopicFilterOptions(links, '8', 'All', [])).toEqual([]);
    expect(getQuizListTopicFilterOptions(links, '8', 'Math', [])).toEqual(['Algebra']);
  });

  it('getQuizFormSubjectOptions merges school subjects with linked subjects', () => {
    const links = buildQuizAcademicLinks(sampleQuizzes);
    const school = ['Computer Science', 'English', 'Hindi', 'Math', 'Science'];
    const options = getQuizFormSubjectOptions(links, '8', school);
    expect(options).toContain('Math');
    expect(options).toContain('Science');
    expect(options).toContain('Hindi');
    expect(options.length).toBeGreaterThan(3);
  });

  it('mergeQuizFormTopicSuggestions merges school API topics with own quizzes', () => {
    const links = buildQuizAcademicLinks(sampleQuizzes);
    const merged = mergeQuizFormTopicSuggestions(
      ['Photosynthesis', 'Cells'],
      links,
      '9',
      'Science',
    );
    expect(merged).toContain('Biology');
    expect(merged).toContain('Photosynthesis');
    expect(merged).toContain('Cells');
  });
});
