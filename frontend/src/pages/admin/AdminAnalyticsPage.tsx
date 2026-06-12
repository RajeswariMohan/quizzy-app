import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TableSearchInput } from '@/components/ui/TableSearchInput';
import { ClassBarChart } from '@/components/charts/ClassBarChart';
import { fetchSchoolAnalytics } from '@/api/admin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { useClientPagination } from '@/hooks/useClientPagination';
import { TablePagination } from '@/components/ui/TablePagination';
import { matchesTableSearch } from '@/utils/tableFilters';

export function AdminAnalyticsPage() {
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const filterLabel = useSchoolFilterStore((s) => s.getFilterLabel());
  const [schools, setSchools] = useState<
    Awaited<ReturnType<typeof fetchSchoolAnalytics>>['schools']
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchSchoolAnalytics()
      .then((d) => setSchools(d.schools))
      .catch((err) => {
        logApiError('Load admin analytics failed', err);
        setError(getApiErrorMessage(err, 'Could not load analytics.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, filterVersion]);

  const filteredSchools = useMemo(
    () =>
      schools.filter((s) =>
        matchesTableSearch(search, [
          s.name,
          String(s.students),
          String(s.teachers),
          String(s.parents),
          String(s.publishedQuizzes),
        ]),
      ),
    [schools, search],
  );

  const studentChart = useMemo(
    () =>
      filteredSchools.map((s) => ({
        label: s.name.length > 12 ? `${s.name.slice(0, 10)}…` : s.name,
        value: s.students,
      })),
    [filteredSchools],
  );

  const accuracyChart = useMemo(
    () =>
      filteredSchools.map((s) => ({
        label: s.name.length > 12 ? `${s.name.slice(0, 10)}…` : s.name,
        value: s.avgAccuracy,
      })),
    [filteredSchools],
  );

  const schoolsPagination = useClientPagination(filteredSchools, {
    resetKey: `${filterVersion}|${search}|${filteredSchools.length}`,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Cross-school analytics</h1>
          <p className="text-muted">Compare engagement and performance · {filterLabel}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <FilterPanel>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Filter comparison</p>
            <p className="text-xs text-muted">
              Showing {filteredSchools.length} of {schools.length}
              {search.trim() ? ' · search active' : ''}
            </p>
          </div>
          {search.trim() && (
            <Button type="button" variant="outline" size="sm" onClick={() => setSearch('')}>
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
        <div className="mt-3">
          <TableSearchInput
            value={search}
            onChange={setSearch}
            placeholder="School name…"
            label="Search schools"
          />
        </div>
      </FilterPanel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Students by school</CardTitle>
          <div className="mt-4 h-64">
            {studentChart.length > 0 ? (
              <ClassBarChart data={studentChart} />
            ) : (
              <p className="text-sm text-muted">No data yet</p>
            )}
          </div>
        </Card>
        <Card>
          <CardTitle>Average accuracy by school</CardTitle>
          <div className="mt-4 h-64">
            {accuracyChart.length > 0 ? (
              <ClassBarChart data={accuracyChart} />
            ) : (
              <p className="text-sm text-muted">No data yet</p>
            )}
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="border-b border-gray-100 px-4 py-3">
          <CardTitle>Detailed comparison</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Teachers</th>
                <th className="px-4 py-3">Parents</th>
                <th className="px-4 py-3">Quizzes</th>
                <th className="px-4 py-3">Accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schoolsPagination.pageItems.map((s) => (
                <tr key={s.id} className="hover:bg-primary/[0.03]">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.students}</td>
                  <td className="px-4 py-3">{s.teachers}</td>
                  <td className="px-4 py-3">{s.parents}</td>
                  <td className="px-4 py-3">{s.publishedQuizzes}</td>
                  <td className="px-4 py-3">{s.avgAccuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {schoolsPagination.showPagination && (
          <TablePagination
            page={schoolsPagination.page}
            totalPages={schoolsPagination.totalPages}
            pageSize={schoolsPagination.pageSize}
            totalItems={schoolsPagination.totalItems}
            rangeStart={schoolsPagination.rangeStart}
            rangeEnd={schoolsPagination.rangeEnd}
            onPageChange={schoolsPagination.setPage}
            onPageSizeChange={schoolsPagination.setPageSize}
          />
        )}
      </Card>
    </div>
  );
}
