import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { StudentProgressTable } from '@/components/progress/StudentProgressTable';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchProgressStudents,
  type ProgressStudentsQuery,
  type StudentProgressRow,
} from '@/api/progress.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { EngagementPanel } from '@/components/engagement/EngagementPanel';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import {
  filterStudentsByProgressStatus,
  sortStudentProgressRows,
  type StudentProgressSort,
  type StudentProgressStatusFilter,
} from '@/utils/studentProgressStatus';

export function StudentProgressPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isParent = role === 'PARENT';
  const canFilterClass = role === 'TEACHER' || role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN';

  const { grades: gradeOptions, sections: sectionOptions } = useSchoolAcademics();
  const [items, setItems] = useState<StudentProgressRow[]>([]);
  const [filters, setFilters] = useState<ProgressStudentsQuery>({});
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StudentProgressStatusFilter>('all');
  const [sortBy, setSortBy] = useState<StudentProgressSort>('accuracy_desc');
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const query: ProgressStudentsQuery = { ...filters };
    if (searchInput.trim()) query.search = searchInput.trim();

    fetchProgressStudents(query)
      .then((res) => setItems(res.items))
      .catch((err) => {
        logApiError('Load student progress failed', err);
        setError(getApiErrorMessage(err, 'Could not load student progress.'));
      })
      .finally(() => setIsLoading(false));
  }, [filters, searchInput, filterVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const derivedGrades = useMemo(
    () =>
      gradeOptions.length > 0
        ? gradeOptions
        : [...new Set(items.map((s) => s.grade).filter(Boolean) as string[])].sort(),
    [gradeOptions, items],
  );
  const derivedSections = useMemo(
    () =>
      sectionOptions.length > 0
        ? sectionOptions
        : [...new Set(items.map((s) => s.section).filter(Boolean) as string[])].sort(),
    [sectionOptions, items],
  );

  const displayedItems = useMemo(() => {
    const filtered = filterStudentsByProgressStatus(items, statusFilter);
    return sortStudentProgressRows(filtered, sortBy);
  }, [items, statusFilter, sortBy]);

  return (
    <PageWithScrollBelowFilter
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">
              {isParent ? 'Child progress' : 'Student progress'}
            </h1>
            <p className="text-muted">
              {isParent
                ? 'Quiz scores, accuracy, and activity for your linked children'
                : 'Track quiz attempts, scores, grade, section, and last activity per student'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
      filter={
        canFilterClass ? (
          <FilterPanel>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs font-medium text-muted">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    type="search"
                    placeholder="Name or email"
                    className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && load()}
                  />
                </div>
              </div>
              <div className="min-w-[120px]">
                <label className="mb-1 block text-xs font-medium text-muted">Grade</label>
                <select
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={filters.grade ?? ''}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, grade: e.target.value || undefined }))
                  }
                >
                  <option value="">All grades</option>
                  {derivedGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div className="min-w-[120px]">
                <label className="mb-1 block text-xs font-medium text-muted">Section</label>
                <select
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  value={filters.section ?? ''}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, section: e.target.value || undefined }))
                  }
                >
                  <option value="">All sections</option>
                  {derivedSections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <Button size="sm" onClick={load} disabled={isLoading}>
                Apply
              </Button>
            </div>
          </FilterPanel>
        ) : undefined
      }
    >
      {error && (
          <Card>
            <p className="text-danger">{error}</p>
          </Card>
        )}

        {canFilterClass && <EngagementPanel />}

        <StudentProgressTable
          items={displayedItems}
          totalCount={items.length}
          isLoading={isLoading}
          isParent={isParent}
          statusFilter={statusFilter}
          sortBy={sortBy}
          onStatusFilterChange={setStatusFilter}
          onSortChange={setSortBy}
        />
    </PageWithScrollBelowFilter>
  );
}
