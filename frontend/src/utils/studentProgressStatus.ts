import type { StudentProgressRow } from '@/api/progress.api';

export type StudentProgressStatusFilter =
  | 'all'
  | 'not_started'
  | 'in_progress'
  | 'completed';

export type StudentProgressSort =
  | 'accuracy_desc'
  | 'accuracy_asc'
  | 'name_asc'
  | 'activity_desc';

export function resolveStudentProgressStatus(
  row: StudentProgressRow,
): Exclude<StudentProgressStatusFilter, 'all'> {
  if (row.quizzesStarted === 0 && row.totalAnswers === 0) {
    return 'not_started';
  }
  if (row.quizzesStarted > 0 && row.quizzesCompleted >= row.quizzesStarted) {
    return 'completed';
  }
  return 'in_progress';
}

export const STUDENT_PROGRESS_STATUS_LABELS: Record<
  Exclude<StudentProgressStatusFilter, 'all'>,
  string
> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

export function filterStudentsByProgressStatus(
  items: StudentProgressRow[],
  status: StudentProgressStatusFilter,
): StudentProgressRow[] {
  if (status === 'all') return items;
  return items.filter((row) => resolveStudentProgressStatus(row) === status);
}

export function sortStudentProgressRows(
  items: StudentProgressRow[],
  sort: StudentProgressSort,
): StudentProgressRow[] {
  const copy = [...items];
  switch (sort) {
    case 'accuracy_desc':
      return copy.sort((a, b) => b.accuracy - a.accuracy || a.displayName.localeCompare(b.displayName));
    case 'accuracy_asc':
      return copy.sort((a, b) => a.accuracy - b.accuracy || a.displayName.localeCompare(b.displayName));
    case 'name_asc':
      return copy.sort((a, b) => a.displayName.localeCompare(b.displayName));
    case 'activity_desc':
      return copy.sort((a, b) => {
        const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        return bTime - aTime || a.displayName.localeCompare(b.displayName);
      });
    default:
      return copy;
  }
}
