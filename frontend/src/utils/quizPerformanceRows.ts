import type { QuizStatus, QuizSummary } from '@/types/quiz';

export type QuizPerformanceRow = QuizSummary & {
  avgAccuracy?: number | null;
};

export type QuizPerformanceStatusFilter = 'all' | QuizStatus;
export type QuizPerformanceSortMode = 'accuracy_desc' | 'accuracy_asc' | 'title_asc';

export function filterAndSortQuizPerformanceRows(
  quizzes: QuizPerformanceRow[],
  statusFilter: QuizPerformanceStatusFilter,
  sortBy: QuizPerformanceSortMode,
): QuizPerformanceRow[] {
  let rows =
    statusFilter === 'all' ? [...quizzes] : quizzes.filter((q) => q.status === statusFilter);

  switch (sortBy) {
    case 'accuracy_asc':
      return rows.sort(
        (a, b) =>
          (a.avgAccuracy ?? -1) - (b.avgAccuracy ?? -1) || a.title.localeCompare(b.title),
      );
    case 'title_asc':
      return rows.sort((a, b) => a.title.localeCompare(b.title));
    default:
      return rows.sort(
        (a, b) =>
          (b.avgAccuracy ?? -1) - (a.avgAccuracy ?? -1) || a.title.localeCompare(b.title),
      );
  }
}
