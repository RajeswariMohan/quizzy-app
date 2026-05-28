import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, RefreshCw, TrendingUp, Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchPlatformOverview } from '@/api/admin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { useClientPagination } from '@/hooks/useClientPagination';
import { TablePagination } from '@/components/ui/TablePagination';

export function AdminOverviewPage() {
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const filterLabel = useSchoolFilterStore((s) => s.getFilterLabel());
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchPlatformOverview>> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const overviewSchools = data?.schools ?? [];
  const schoolsPagination = useClientPagination(overviewSchools, {
    resetKey: `${filterVersion}|${overviewSchools.length}`,
  });

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchPlatformOverview()
      .then(setData)
      .catch((err) => {
        logApiError('Load platform overview failed', err);
        setError(getApiErrorMessage(err, 'Could not load platform overview.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load, filterVersion]);

  if (isLoading && !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <p className="text-danger">{error ?? 'No data'}</p>
      </Card>
    );
  }

  const { totals, settings } = data;
  const statCards = [
    { label: 'Active schools', value: String(totals.activeSchools), icon: Building2 },
    { label: 'Students', value: String(totals.students), icon: Users },
    { label: 'Published quizzes', value: String(totals.publishedQuizzes), icon: TrendingUp },
    { label: 'Platform avg accuracy', value: `${totals.platformAvgAccuracy}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Platform overview</h1>
          <p className="text-muted">Cross-school metrics · {filterLabel}</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {settings.maintenanceMode && (
        <Card className="border-warning/30 bg-warning/5">
          <p className="text-sm font-medium text-warning">Maintenance mode is ON</p>
          <p className="mt-1 text-sm text-muted">
            {settings.maintenanceMessage ?? 'Users may be blocked from signing in.'}
          </p>
          <Link to="/admin/settings" className="mt-2 inline-block text-sm text-primary hover:underline">
            Manage features →
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="!p-4">
            <div className="flex items-center gap-2 text-muted">
              <Icon className="h-4 w-4" />
              <p className="text-sm">{label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-ink">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="border-b border-gray-100 px-4 py-3">
          <CardTitle>Schools at a glance</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Teachers</th>
                <th className="px-4 py-3">Quizzes</th>
                <th className="px-4 py-3">Avg accuracy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {schoolsPagination.pageItems.map((s) => (
                <tr key={s.id} className="hover:bg-primary/[0.03]">
                  <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
                  <td className="px-4 py-3">{s.students}</td>
                  <td className="px-4 py-3">{s.teachers}</td>
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
        <div className="border-t border-gray-100 px-4 py-3">
          <Link to="/admin/schools" className="text-sm text-primary hover:underline">
            View all schools →
          </Link>
        </div>
      </Card>
    </div>
  );
}
