import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CardTitle } from '@/components/ui/Card';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import type { AnalyticsFilterOptions, AnalyticsQueryFilters } from '@/api/dashboard.api';
import { formatQuizCreator, resolveQuizGrade } from '@/utils/quizMeta';
import {
  ANALYTICS_FILTER_ALL,
  applyAnalyticsFilterField,
  getLinkedFilterValues,
  mergeAnalyticsFilterOptions,
  withAllOption,
} from '@/utils/analyticsFilterLinks';
import type { QuizStatus, QuizSummary } from '@/types/quiz';
import { cn } from '@/lib/cn';
import { useClientPagination } from '@/hooks/useClientPagination';
import { TablePagination } from '@/components/ui/TablePagination';
import {
  filterAndSortQuizPerformanceRows,
  type QuizPerformanceSortMode,
  type QuizPerformanceStatusFilter,
} from '@/utils/quizPerformanceRows';

type QuizRow = QuizSummary & {
  avgAccuracy?: number | null;
  className?: string | null;
};

const STATUS_FILTER_OPTIONS = ['All', 'Draft', 'Published', 'Archived'] as const;
const SORT_OPTIONS = ['Avg accuracy (high to low)', 'Avg accuracy (low to high)', 'Title (A–Z)'] as const;

type StatusFilter = QuizPerformanceStatusFilter;
type SortMode = QuizPerformanceSortMode;

function statusLabelToFilter(label: (typeof STATUS_FILTER_OPTIONS)[number]): StatusFilter {
  switch (label) {
    case 'Draft':
      return 'DRAFT';
    case 'Published':
      return 'PUBLISHED';
    case 'Archived':
      return 'ARCHIVED';
    default:
      return 'all';
  }
}

function filterToStatusLabel(filter: StatusFilter): (typeof STATUS_FILTER_OPTIONS)[number] {
  switch (filter) {
    case 'DRAFT':
      return 'Draft';
    case 'PUBLISHED':
      return 'Published';
    case 'ARCHIVED':
      return 'Archived';
    default:
      return 'All';
  }
}

function sortLabelToMode(label: (typeof SORT_OPTIONS)[number]): SortMode {
  switch (label) {
    case 'Avg accuracy (low to high)':
      return 'accuracy_asc';
    case 'Title (A–Z)':
      return 'title_asc';
    default:
      return 'accuracy_desc';
  }
}

function sortModeToLabel(mode: SortMode): (typeof SORT_OPTIONS)[number] {
  switch (mode) {
    case 'accuracy_asc':
      return 'Avg accuracy (low to high)';
    case 'title_asc':
      return 'Title (A–Z)';
    default:
      return 'Avg accuracy (high to low)';
  }
}

function statusBadgeClass(status: QuizStatus): string {
  if (status === 'PUBLISHED') return 'bg-success/15 text-success';
  if (status === 'ARCHIVED') return 'bg-gray-200 text-muted';
  return 'bg-warning/15 text-warning';
}

interface QuizPerformanceTableProps {
  quizzes: QuizRow[];
  filterOptions: AnalyticsFilterOptions;
  filters: AnalyticsQueryFilters;
  onFiltersChange: (filters: AnalyticsQueryFilters) => void;
}

export function QuizPerformanceTable({
  quizzes,
  filterOptions,
  filters,
  onFiltersChange,
}: QuizPerformanceTableProps) {
  const { grades: schoolGrades } = useSchoolAcademics();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortMode>('accuracy_desc');

  const mergedOptions = useMemo(
    () => mergeAnalyticsFilterOptions(filterOptions, schoolGrades, filterOptions.subjects),
    [filterOptions, schoolGrades],
  );
  const links = mergedOptions.links ?? [];

  const linkedValues = useMemo(
    () =>
      getLinkedFilterValues(links, filters, {
        grades: mergedOptions.grades,
        subjects: mergedOptions.subjects,
        topics: mergedOptions.topics,
      }),
    [links, filters, mergedOptions.grades, mergedOptions.subjects, mergedOptions.topics],
  );

  const setPageField = (key: keyof AnalyticsQueryFilters, raw: string) => {
    onFiltersChange(
      applyAnalyticsFilterField(
        filters,
        key,
        raw,
        linkedValues.topics,
        mergedOptions.topics,
        links.length,
      ),
    );
  };

  const displayed = useMemo(
    () => filterAndSortQuizPerformanceRows(quizzes, statusFilter, sortBy),
    [quizzes, statusFilter, sortBy],
  );

  const paginationResetKey = `${statusFilter}|${sortBy}|${filters.grade ?? ''}|${quizzes.length}`;
  const pagination = useClientPagination(displayed, { resetKey: paginationResetKey });

  const accuracySortActive = sortBy === 'accuracy_desc' || sortBy === 'accuracy_asc';
  const tableFiltersActive = statusFilter !== 'all' || sortBy !== 'accuracy_desc';

  const clearTableFilters = () => {
    setStatusFilter('all');
    setSortBy('accuracy_desc');
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-card">
      <div className="space-y-3 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <CardTitle>All quizzes — performance summary</CardTitle>
            <p className="mt-1 text-xs text-muted">
              {displayed.length} quiz{displayed.length === 1 ? '' : 'zes'} match
              {statusFilter !== 'all' ? ' · status filtered' : ''}
              {pagination.showPagination ? ' · paginated below' : ''}
            </p>
          </div>
          {tableFiltersActive && (
            <Button type="button" variant="outline" size="sm" onClick={clearTableFilters}>
              <RotateCcw className="h-4 w-4" />
              Clear table filters
            </Button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FieldSelect
            label="Grade"
            value={filters.grade ?? ANALYTICS_FILTER_ALL}
            onChange={(v) => setPageField('grade', v)}
            options={withAllOption(linkedValues.grades)}
          />
          <FieldSelect
            label="Status"
            value={filterToStatusLabel(statusFilter)}
            onChange={(v) =>
              setStatusFilter(statusLabelToFilter(v as (typeof STATUS_FILTER_OPTIONS)[number]))
            }
            options={[...STATUS_FILTER_OPTIONS]}
          />
          <FieldSelect
            label="Sort by"
            value={sortModeToLabel(sortBy)}
            onChange={(v) => setSortBy(sortLabelToMode(v as (typeof SORT_OPTIONS)[number]))}
            options={[...SORT_OPTIONS]}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3">Quiz</th>
              <th className="px-4 py-3">Created by</th>
              <th className="px-4 py-3">Grade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Questions</th>
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <p className="font-medium text-ink">No quizzes match your filters</p>
                  <p className="mt-1 text-sm text-muted">
                    Try a different grade, creator, or status — or clear filters above.
                  </p>
                </td>
              </tr>
            ) : (
              pagination.pageItems.map((q) => (
                <tr key={q.id} className="transition-colors hover:bg-primary/[0.03]">
                  <td className="px-4 py-3 font-medium text-ink">{q.title}</td>
                  <td className="px-4 py-3 text-muted">{formatQuizCreator(q) ?? '—'}</td>
                  <td className="px-4 py-3 text-muted">{resolveQuizGrade(q) ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusBadgeClass(q.status)}>{q.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{q.questionCount ?? 0}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex min-w-[3rem] justify-center rounded-lg px-2 py-1 text-sm font-semibold',
                        q.avgAccuracy != null && q.avgAccuracy >= 70
                          ? 'bg-success/10 text-success'
                          : q.avgAccuracy != null && q.avgAccuracy > 0
                            ? 'bg-warning/10 text-warning'
                            : 'bg-gray-100 text-muted',
                      )}
                    >
                      {q.avgAccuracy != null ? `${q.avgAccuracy}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination.showPagination && (
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
