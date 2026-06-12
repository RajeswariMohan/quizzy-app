import { Link } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronRight, Search, TrendingUp } from 'lucide-react';
import { AcademicGroupFilterFields } from '@/components/academics/AcademicGroupFilterFields';
import { Badge } from '@/components/ui/Badge';
import { FieldSelect } from '@/components/ui/FieldSelect';
import type { StudentProgressRow } from '@/api/progress.api';
import type { AcademicGroupFilterValues } from '@/utils/gradeStructure';
import { formatActiveTime, formatDateTime } from '@/lib/formatDateTime';
import {
  resolveStudentProgressStatus,
  STUDENT_PROGRESS_STATUS_LABELS,
  type StudentProgressSort,
  type StudentProgressStatusFilter,
} from '@/utils/studentProgressStatus';
import { cn } from '@/lib/cn';
import { useClientPagination } from '@/hooks/useClientPagination';
import { TablePagination } from '@/components/ui/TablePagination';

const STATUS_FILTER_OPTIONS = ['All', 'Not started', 'In progress', 'Completed'] as const;
const SORT_OPTIONS = [
  'Accuracy (high to low)',
  'Accuracy (low to high)',
  'Name (A–Z)',
  'Last activity (newest)',
] as const;

function statusFilterToValue(label: (typeof STATUS_FILTER_OPTIONS)[number]): StudentProgressStatusFilter {
  switch (label) {
    case 'Not started':
      return 'not_started';
    case 'In progress':
      return 'in_progress';
    case 'Completed':
      return 'completed';
    default:
      return 'all';
  }
}

function statusFilterToLabel(value: StudentProgressStatusFilter): (typeof STATUS_FILTER_OPTIONS)[number] {
  switch (value) {
    case 'not_started':
      return 'Not started';
    case 'in_progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    default:
      return 'All';
  }
}

function sortToValue(label: (typeof SORT_OPTIONS)[number]): StudentProgressSort {
  switch (label) {
    case 'Accuracy (low to high)':
      return 'accuracy_asc';
    case 'Name (A–Z)':
      return 'name_asc';
    case 'Last activity (newest)':
      return 'activity_desc';
    default:
      return 'accuracy_desc';
  }
}

function sortToLabel(value: StudentProgressSort): (typeof SORT_OPTIONS)[number] {
  switch (value) {
    case 'accuracy_asc':
      return 'Accuracy (low to high)';
    case 'name_asc':
      return 'Name (A–Z)';
    case 'activity_desc':
      return 'Last activity (newest)';
    default:
      return 'Accuracy (high to low)';
  }
}

function StatusBadge({ row }: { row: StudentProgressRow }) {
  const status = resolveStudentProgressStatus(row);
  const label = STUDENT_PROGRESS_STATUS_LABELS[status];
  const className =
    status === 'completed'
      ? 'bg-success/15 text-success'
      : status === 'in_progress'
        ? 'bg-warning/15 text-warning'
        : 'bg-gray-100 text-muted';

  return <Badge className={className}>{label}</Badge>;
}

export interface StudentProgressDirectoryFilters {
  search: string;
  onSearchChange: (value: string) => void;
  filterGrade: string;
  onFilterGradeChange: (grade: string) => void;
  filterAcademicGroup: AcademicGroupFilterValues;
  onFilterAcademicGroupChange: (values: AcademicGroupFilterValues) => void;
  gradeOptions: string[];
  gradeSections: Record<string, string[]>;
  hasActiveServerFilters: boolean;
}

interface StudentProgressTableProps {
  items: StudentProgressRow[];
  totalCount: number;
  isLoading: boolean;
  isParent: boolean;
  statusFilter: StudentProgressStatusFilter;
  sortBy: StudentProgressSort;
  onStatusFilterChange: (value: StudentProgressStatusFilter) => void;
  onSortChange: (value: StudentProgressSort) => void;
  directoryFilters?: StudentProgressDirectoryFilters;
}

export function StudentProgressTable({
  items,
  totalCount,
  isLoading,
  isParent,
  statusFilter,
  sortBy,
  onStatusFilterChange,
  onSortChange,
  directoryFilters,
}: StudentProgressTableProps) {
  const colSpan = isParent ? 8 : 10;
  const accuracySortActive = sortBy === 'accuracy_desc' || sortBy === 'accuracy_asc';
  const pagination = useClientPagination(items, {
    resetKey: `${statusFilter}|${sortBy}|${totalCount}`,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-ink">Students</p>
          <p className="text-xs text-muted">
            {items.length} of {totalCount} students
            {directoryFilters?.hasActiveServerFilters ? ' · directory filters active' : ''}
            {statusFilter !== 'all' ? ' · filtered by status' : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {directoryFilters && (
            <>
              <div className="min-w-[140px] flex-1 sm:max-w-xs">
                <label className="mb-1 block text-sm font-medium text-ink">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    placeholder="Name or email"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
                    value={directoryFilters.search}
                    onChange={(e) => directoryFilters.onSearchChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="min-w-[120px]">
                <FieldSelect
                  label="Grade"
                  value={directoryFilters.filterGrade || 'All'}
                  onChange={(g) =>
                    directoryFilters.onFilterGradeChange(g === 'All' ? '' : g)
                  }
                  options={['All', ...directoryFilters.gradeOptions]}
                />
              </div>
              {directoryFilters.filterGrade && (
                <div className="min-w-[200px] flex-1 sm:max-w-sm">
                  <AcademicGroupFilterFields
                    grade={directoryFilters.filterGrade}
                    gradeSections={directoryFilters.gradeSections}
                    values={directoryFilters.filterAcademicGroup}
                    onChange={directoryFilters.onFilterAcademicGroupChange}
                  />
                </div>
              )}
            </>
          )}
          <FieldSelect
            label="Status"
            value={statusFilterToLabel(statusFilter)}
            onChange={(v) => onStatusFilterChange(statusFilterToValue(v as (typeof STATUS_FILTER_OPTIONS)[number]))}
            options={[...STATUS_FILTER_OPTIONS]}
          />
          <FieldSelect
            label="Sort by"
            value={sortToLabel(sortBy)}
            onChange={(v) => onSortChange(sortToValue(v as (typeof SORT_OPTIONS)[number]))}
            options={[...SORT_OPTIONS]}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="sticky top-0 z-[1] border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Student</th>
              {!isParent && <th className="px-4 py-3">Grade</th>}
              {!isParent && <th className="px-4 py-3">Section</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Quizzes</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  Avg accuracy
                  {accuracySortActive &&
                    (sortBy === 'accuracy_desc' ? (
                      <ArrowDown className="h-3.5 w-3.5 text-primary" aria-hidden />
                    ) : (
                      <ArrowUp className="h-3.5 w-3.5 text-primary" aria-hidden />
                    ))}
                </span>
              </th>
              <th className="px-4 py-3">Points</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Last activity</th>
              <th className="px-4 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading && items.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-14 text-center text-muted">
                  Loading students…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-4 py-14 text-center">
                  <p className="font-medium text-ink">No students match your filters</p>
                  <p className="mt-1 text-sm text-muted">
                    Try a different status or clear grade and section filters.
                  </p>
                </td>
              </tr>
            ) : (
              pagination.pageItems.map((row) => (
                <tr
                  key={row.studentId}
                  className="transition-colors hover:bg-primary/[0.03]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{row.displayName}</p>
                    <p className="text-xs text-muted">{row.email}</p>
                  </td>
                  {!isParent && (
                    <td className="px-4 py-3 text-muted">{row.grade ?? '—'}</td>
                  )}
                  {!isParent && (
                    <td className="px-4 py-3 text-muted">{row.section ?? '—'}</td>
                  )}
                  <td className="px-4 py-3">
                    <StatusBadge row={row} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-ink">{row.quizzesCompleted}</span>
                    <span className="text-muted"> / {row.quizzesStarted}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex min-w-[3rem] items-center justify-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold',
                        row.accuracy >= 70
                          ? 'bg-success/10 text-success'
                          : row.accuracy > 0
                            ? 'bg-warning/10 text-warning'
                            : 'bg-gray-100 text-muted',
                      )}
                    >
                      <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                      {row.accuracy}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{row.totalPointsEarned}</td>
                  <td className="px-4 py-3 text-muted" title={`${row.sessionCount} sessions`}>
                    {formatActiveTime(row.totalActiveSeconds)}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {formatDateTime(row.lastActivityAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/progress/students/${row.studentId}`}
                      className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                      View
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && pagination.totalItems > 0 && (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          pageSize={pagination.pageSize}
          totalItems={pagination.totalItems}
          rangeStart={pagination.rangeStart}
          rangeEnd={pagination.rangeEnd}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
        />
      )}
    </div>
  );
}
