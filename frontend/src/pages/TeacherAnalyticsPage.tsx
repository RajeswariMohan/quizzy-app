import { useCallback, useEffect, useState } from 'react';
import { BarChart3, RefreshCw, TrendingUp, UserCircle, Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClassBarChart } from '@/components/charts/ClassBarChart';
import { formatUserRole } from '@/utils/userRole';
import { MasteryBreakdownCard } from '@/components/analytics/MasteryBreakdownCard';
import { PerformanceLineChart } from '@/components/charts/PerformanceLineChart';
import { fetchTeacherDashboard, type AnalyticsQueryFilters, type TeacherDashboardData } from '@/api/dashboard.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { AnalyticsFilterBar } from '@/components/analytics/AnalyticsFilterBar';
import { QuizPerformanceTable } from '@/components/analytics/QuizPerformanceTable';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { useClientPagination } from '@/hooks/useClientPagination';
import { TablePagination } from '@/components/ui/TablePagination';

const EMPTY_FILTER_OPTIONS = {
  grades: [] as string[],
  subjects: [] as string[],
  boards: [] as string[],
  topics: [] as string[],
  links: [] as { grade: string; subject: string; board?: string; topic: string }[],
  creators: [] as { userId: string; displayName: string; role: string }[],
};

export function TeacherAnalyticsPage() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsQueryFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const filterLabel = useSchoolFilterStore((s) => s.getFilterLabel());
  const userRole = useAuthStore((s) => s.user?.role);
  const isSuperAdmin = userRole === 'SUPER_ADMIN';
  const isTeacher = userRole === 'TEACHER';

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchTeacherDashboard(analyticsFilters)
      .then(setData)
      .catch((err) => {
        logApiError('Load analytics failed', err);
        setError(getApiErrorMessage(err, 'Could not load analytics.'));
      })
      .finally(() => setIsLoading(false));
  }, [analyticsFilters]);

  useEffect(() => {
    load();
  }, [load, filterVersion]);

  const creatorPerformance = data?.creatorPerformance ?? [];
  const creatorPagination = useClientPagination(creatorPerformance, {
    resetKey: `${filterVersion}|${JSON.stringify(analyticsFilters)}|${creatorPerformance.length}`,
  });

  const stats = data
    ? [
        {
          label: isTeacher ? 'Students in reach' : 'Total students',
          value: String(data.stats.totalStudents),
          icon: Users,
        },
        {
          label: isTeacher ? 'My published quizzes' : 'Published quizzes',
          value: String(data.stats.quizzesConducted),
          icon: BarChart3,
        },
        {
          label: isTeacher ? 'Avg accuracy' : 'School avg accuracy',
          value: `${data.stats.avgAccuracy}%`,
          icon: TrendingUp,
        },
        { label: 'Top score', value: data.stats.topScore, icon: TrendingUp },
      ]
    : [];

  const quizTableRows = (data?.recentQuizzes ?? []).filter((q) => q.status === 'PUBLISHED');

  return (
    <PageWithScrollBelowFilter
      header={
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Analytics</h1>
            <p className="text-muted">
              {isSuperAdmin
                ? `Aggregated analytics · ${filterLabel}`
                : isTeacher
                  ? 'Metrics for your published quizzes and students matching those audiences'
                  : 'Class performance, topic mastery, and student rankings from live responses'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      }
      filter={
        (data || !isLoading) ? (
          <AnalyticsFilterBar
            options={data?.filterOptions ?? EMPTY_FILTER_OPTIONS}
            filters={analyticsFilters}
            onChange={setAnalyticsFilters}
          />
        ) : undefined
      }
    >
      {isLoading && !data && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <Card>
          <p className="text-danger">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={load}>
            Try again
          </Button>
        </Card>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map(({ label, value, icon: Icon }) => (
              <Card key={label} className="!p-4">
                <Icon className="h-5 w-5 text-primary" />
                <p className="mt-2 text-sm text-muted">{label}</p>
                <p className="text-2xl font-bold text-ink">{value}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>Quiz performance trend</CardTitle>
              <p className="mt-1 text-xs text-muted">Average accuracy per published quiz</p>
              {data.quizPerformance.length > 0 ? (
                <PerformanceLineChart
                  data={data.quizPerformance.map((p) => ({
                    label: p.label,
                    value: p.value,
                  }))}
                />
              ) : (
                <p className="mt-6 text-sm text-muted">
                  Publish quizzes and collect student answers to see trends.
                </p>
              )}
            </Card>

            <MasteryBreakdownCard
              subjectPerformance={data.subjectPerformance ?? []}
              topicPerformance={data.topicPerformance ?? []}
              appliedFilters={data.appliedFilters}
            />
          </div>

          {!isTeacher && creatorPerformance.length > 0 && (
            <Card className="overflow-hidden !p-0">
              <div className="border-b border-gray-100 px-4 py-3">
                <CardTitle className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  Performance by quiz creator
                </CardTitle>
                <p className="mt-1 text-xs text-muted">
                  Teachers and school admins — quiz count and student accuracy on their quizzes
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3">Creator</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Quizzes</th>
                      <th className="px-4 py-3">Published</th>
                      <th className="px-4 py-3">Avg accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {creatorPagination.pageItems.map((row) => (
                      <tr key={row.userId} className="hover:bg-primary/[0.03]">
                        <td className="px-4 py-3 font-medium">{row.displayName}</td>
                        <td className="px-4 py-3">{formatUserRole(row.role)}</td>
                        <td className="px-4 py-3">{row.quizCount}</td>
                        <td className="px-4 py-3">{row.publishedCount}</td>
                        <td className="px-4 py-3">
                          {row.avgAccuracy != null ? `${row.avgAccuracy}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {creatorPagination.showPagination && (
                <TablePagination
                  page={creatorPagination.page}
                  totalPages={creatorPagination.totalPages}
                  pageSize={creatorPagination.pageSize}
                  totalItems={creatorPagination.totalItems}
                  rangeStart={creatorPagination.rangeStart}
                  rangeEnd={creatorPagination.rangeEnd}
                  onPageChange={creatorPagination.setPage}
                  onPageSizeChange={creatorPagination.setPageSize}
                />
              )}
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>Published quiz breakdown</CardTitle>
              {quizTableRows.length > 0 ? (
                <ClassBarChart
                  data={quizTableRows.slice(0, 8).map((q, i) => ({
                    label: q.title.length > 12 ? `Q${i + 1}` : q.title,
                    value: q.avgAccuracy ?? 0,
                  }))}
                />
              ) : (
                <p className="mt-4 text-sm text-muted">No published quizzes with responses.</p>
              )}
            </Card>

            <Card>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> Top students
              </CardTitle>
              <ul className="mt-4 space-y-3">
                {data.topStudents.map((s) => (
                  <li
                    key={s.rank}
                    className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
                  >
                    <span className="font-medium">
                      #{s.rank} {s.name}
                    </span>
                    <span className="text-primary">{s.score}</span>
                  </li>
                ))}
                {data.topStudents.length === 0 && (
                  <p className="text-sm text-muted">No student activity recorded yet.</p>
                )}
              </ul>
            </Card>
          </div>

          <QuizPerformanceTable
            quizzes={data.quizSummaryList ?? data.recentQuizzes}
            filterOptions={data.filterOptions ?? EMPTY_FILTER_OPTIONS}
            filters={analyticsFilters}
            onFiltersChange={setAnalyticsFilters}
          />
        </>
      )}
    </PageWithScrollBelowFilter>
  );
}
