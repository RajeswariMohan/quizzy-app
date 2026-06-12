import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { StudentProgressTable } from '@/components/progress/StudentProgressTable';
import { EngagementFilterFields } from '@/components/engagement/EngagementFilterFields';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchProgressStudents,
  type ProgressStudentsQuery,
  type StudentProgressRow,
} from '@/api/progress.api';
import type { EngagementQuery } from '@/api/engagement.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { defaultEngagementDateRange } from '@/lib/dateRange';
import {
  DEFAULT_ACADEMIC_GROUP_FILTER,
  resolveFilterSectionValue,
  type AcademicGroupFilterValues,
} from '@/utils/gradeStructure';
import { sortGrades } from '@/utils/academicOptions';
import { GRADES } from '@/constants/academics';
import { EngagementPanel } from '@/components/engagement/EngagementPanel';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import {
  filterStudentsByProgressStatus,
  sortStudentProgressRows,
  type StudentProgressSort,
  type StudentProgressStatusFilter,
} from '@/utils/studentProgressStatus';

const ENGAGEMENT_DEFAULT_DAYS = 30;

function hasActiveDirectoryFilters(
  search: string,
  filterGrade: string,
  filterAcademicGroup: AcademicGroupFilterValues,
): boolean {
  return (
    search.trim() !== '' ||
    filterGrade !== '' ||
    filterAcademicGroup.department !== 'All' ||
    filterAcademicGroup.sectionLetter !== 'All' ||
    filterAcademicGroup.group !== 'All'
  );
}

export function StudentProgressPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isParent = role === 'PARENT';
  const canFilterClass = role === 'TEACHER' || role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN';

  const engagementDefaultRange = useMemo(
    () => defaultEngagementDateRange(ENGAGEMENT_DEFAULT_DAYS),
    [],
  );
  const [engagementFilters, setEngagementFilters] = useState<EngagementQuery>(() => ({
    ...engagementDefaultRange,
  }));
  const [engagementRefreshKey, setEngagementRefreshKey] = useState(0);

  const { grades: gradeOptions, gradeSections } = useSchoolAcademics();
  const [items, setItems] = useState<StudentProgressRow[]>([]);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterAcademicGroup, setFilterAcademicGroup] = useState<AcademicGroupFilterValues>({
    ...DEFAULT_ACADEMIC_GROUP_FILTER,
  });
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StudentProgressStatusFilter>('all');
  const [sortBy, setSortBy] = useState<StudentProgressSort>('accuracy_desc');
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const query: ProgressStudentsQuery = {};
    if (debouncedSearch.trim()) query.search = debouncedSearch.trim();
    if (filterGrade) query.grade = filterGrade;
    const sectionValue = filterGrade
      ? resolveFilterSectionValue({
          grade: filterGrade,
          gradeSections,
          ...filterAcademicGroup,
        })
      : undefined;
    if (sectionValue) query.section = sectionValue;

    fetchProgressStudents(query)
      .then((res) => setItems(res.items))
      .catch((err) => {
        logApiError('Load student progress failed', err);
        setError(getApiErrorMessage(err, 'Could not load student progress.'));
      })
      .finally(() => setIsLoading(false));
  }, [debouncedSearch, filterGrade, filterAcademicGroup, gradeSections, filterVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshAll = useCallback(() => {
    setEngagementRefreshKey((k) => k + 1);
    load();
  }, [load]);

  const derivedGrades = useMemo(() => {
    const fromItems = [
      ...new Set(items.map((s) => s.grade).filter(Boolean) as string[]),
    ];
    const order = gradeOptions.length > 0 ? gradeOptions : GRADES;
    const pool = gradeOptions.length > 0 ? gradeOptions : fromItems;
    return sortGrades(pool, order);
  }, [gradeOptions, items]);

  const hasActiveServerFilters = useMemo(
    () => hasActiveDirectoryFilters(searchInput, filterGrade, filterAcademicGroup),
    [searchInput, filterGrade, filterAcademicGroup],
  );

  const directoryFilters = useMemo(
    () =>
      canFilterClass
        ? {
            search: searchInput,
            onSearchChange: setSearchInput,
            filterGrade,
            onFilterGradeChange: (grade: string) => {
              setFilterGrade(grade);
              setFilterAcademicGroup({ ...DEFAULT_ACADEMIC_GROUP_FILTER });
            },
            filterAcademicGroup,
            onFilterAcademicGroupChange: setFilterAcademicGroup,
            gradeOptions: derivedGrades,
            gradeSections,
            hasActiveServerFilters,
          }
        : undefined,
    [
      canFilterClass,
      searchInput,
      filterGrade,
      filterAcademicGroup,
      derivedGrades,
      gradeSections,
      hasActiveServerFilters,
    ],
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
          <Button variant="outline" size="sm" onClick={refreshAll} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
      filter={
        canFilterClass ? (
          <FilterPanel>
            <p className="text-sm font-medium text-ink">Engagement (session time)</p>
            <p className="mt-0.5 text-xs text-muted">
              Date range for charts and session totals below
            </p>
            <div className="mt-2">
              <EngagementFilterFields
                filters={engagementFilters}
                defaultRange={engagementDefaultRange}
                onChange={setEngagementFilters}
                idPrefix="progress-engagement"
              />
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

      {canFilterClass && (
        <EngagementPanel filters={engagementFilters} refreshKey={engagementRefreshKey} />
      )}

      <StudentProgressTable
        items={displayedItems}
        totalCount={items.length}
        isLoading={isLoading}
        isParent={isParent}
        statusFilter={statusFilter}
        sortBy={sortBy}
        onStatusFilterChange={setStatusFilter}
        onSortChange={setSortBy}
        directoryFilters={directoryFilters}
      />
    </PageWithScrollBelowFilter>
  );
}
