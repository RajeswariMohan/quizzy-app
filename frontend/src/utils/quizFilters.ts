import type { QuizStatus, QuizSummary } from '@/types/quiz';
import { getQuizSectionLabel, resolveQuizGrade } from '@/utils/quizMeta';

export interface QuizListFilters {
  search: string;
  grade: string;
  subject: string;
  board: string;
  topic: string;
  sort: 'newest' | 'oldest' | 'title';
}

export const DEFAULT_QUIZ_LIST_FILTERS: QuizListFilters = {
  search: '',
  grade: 'All',
  subject: 'All',
  board: 'All',
  topic: 'All',
  sort: 'newest',
};

export interface QuizFilterOptions {
  grades: string[];
  subjects: string[];
  boards: string[];
  topics: string[];
}

function uniqueSorted(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.filter((v): v is string => !!v?.trim()))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

export function buildQuizFilterOptions(quizzes: QuizSummary[]): QuizFilterOptions {
  return {
    grades: uniqueSorted(quizzes.map((q) => resolveQuizGrade(q))),
    subjects: uniqueSorted(quizzes.map((q) => q.subject)),
    boards: uniqueSorted(quizzes.map((q) => q.board)),
    topics: uniqueSorted(quizzes.map((q) => q.topic)),
  };
}

export function hasActiveQuizFilters(filters: QuizListFilters): boolean {
  return (
    filters.search.trim().length > 0 ||
    filters.grade !== 'All' ||
    filters.subject !== 'All' ||
    filters.board !== 'All' ||
    filters.topic !== 'All' ||
    filters.sort !== 'newest'
  );
}

export function filterQuizzesByStatus(
  quizzes: QuizSummary[],
  status: 'ALL' | QuizStatus,
): QuizSummary[] {
  if (status === 'ALL') return quizzes;
  return quizzes.filter((q) => q.status === status);
}

export function applyQuizListFilters(
  quizzes: QuizSummary[],
  filters: QuizListFilters,
): QuizSummary[] {
  const term = filters.search.trim().toLowerCase();

  let result = quizzes.filter((q) => {
    if (term) {
      const haystack = [
        q.title,
        q.subject,
        q.topic,
        q.board,
        q.grade,
        resolveQuizGrade(q),
        getQuizSectionLabel(q),
        q.className,
        q.schoolName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (filters.grade !== 'All') {
      const label = resolveQuizGrade(q);
      if (label !== filters.grade && q.grade !== filters.grade) return false;
    }
    if (filters.subject !== 'All' && q.subject !== filters.subject) return false;
    if (filters.board !== 'All' && q.board !== filters.board) return false;
    if (filters.topic !== 'All' && q.topic !== filters.topic) return false;

    return true;
  });

  result = [...result].sort((a, b) => {
    if (filters.sort === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return filters.sort === 'oldest' ? aTime - bTime : bTime - aTime;
  });

  return result;
}
