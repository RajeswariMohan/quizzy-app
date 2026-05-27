import { useCallback, useEffect, useState } from 'react';
import { BarChart3, RefreshCw, TrendingUp, UserCircle, Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClassBarChart } from '@/components/charts/ClassBarChart';
import { formatQuizCreator, resolveQuizGrade } from '@/utils/quizMeta';
import { formatUserRole } from '@/utils/userRole';
import { TopicDonutChart } from '@/components/charts/TopicDonutChart';
import { PerformanceLineChart } from '@/components/charts/PerformanceLineChart';
import { fetchTeacherDashboard, type AnalyticsQueryFilters, type TeacherDashboardData } from '@/api/dashboard.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { AnalyticsFilterBar } from '@/components/analytics/AnalyticsFilterBar';

const EMPTY_FILTER_OPTIONS = {
  grades: [] as string[],
  subjects: [] as string[],
  boards: [] as string[],
  topics: [] as string[],
  creators: [] as { userId: string; displayName: string; role: string }[],
};

export function TeacherAnalyticsPage() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [analyticsFilters, setAnalyticsFilters] = useState<AnalyticsQueryFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const filterLabel = useSchoolFilterStore((s) => s.getFilterLabel());
  const isSuperAdmin = useAuthStore((s) => s.user?.role === 'SUPER_ADMIN');

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

  const stats = data
    ? [
        {
          label: 'Total students',
          value: String(data.stats.totalStudents),
          icon: Users,
        },
        {
          label: 'Published quizzes',
          value: String(data.stats.quizzesConducted),
          icon: BarChart3,
        },
        {
          label: 'School avg accuracy',
          value: `${data.stats.avgAccuracy}%`,
          icon: TrendingUp,
        },
        { label: 'Top score', value: data.stats.topScore, icon: TrendingUp },
      ]
    : [];

  const quizTableRows = (data?.recentQuizzes ?? []).filter((q) => q.status === 'PUBLISHED');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Analytics</h1>
          <p className="text-muted">
            {isSuperAdmin
              ? `Aggregated analytics · ${filterLabel}`
              : 'Class performance, topic mastery, and student rankings from live responses'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

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

      {(data || !isLoading) && (
        <AnalyticsFilterBar
          options={data?.filterOptions ?? EMPTY_FILTER_OPTIONS}
          filters={analyticsFilters}
          onChange={setAnalyticsFilters}
        />
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

            <Card>
              <CardTitle>Topic-wise mastery</CardTitle>
              <p className="mt-1 text-xs text-muted">Aggregated from all student responses</p>
              {data.topicPerformance.length > 0 ? (
                <>
                  <TopicDonutChart data={data.topicPerformance} />
                  <ul className="mt-3 space-y-1 text-sm">
                    {data.topicPerformance.map((t) => (
                      <li key={t.topic} className="flex justify-between">
                        <span className="text-muted">{t.topic}</span>
                        <span className="font-medium">{t.percentage}%</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted">No topic data yet.</p>
              )}
            </Card>
          </div>

          {(data.creatorPerformance?.length ?? 0) > 0 && (
            <Card>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5" />
                Performance by quiz creator
              </CardTitle>
              <p className="mt-1 text-xs text-muted">
                Teachers and school admins — quiz count and student accuracy on their quizzes
              </p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-muted">
                    <tr>
                      <th className="pb-2">Creator</th>
                      <th className="pb-2">Role</th>
                      <th className="pb-2">Quizzes</th>
                      <th className="pb-2">Published</th>
                      <th className="pb-2">Avg accuracy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.creatorPerformance!.map((row) => (
                      <tr key={row.userId} className="border-t border-gray-100">
                        <td className="py-2.5 font-medium">{row.displayName}</td>
                        <td className="py-2.5">{formatUserRole(row.role)}</td>
                        <td className="py-2.5">{row.quizCount}</td>
                        <td className="py-2.5">{row.publishedCount}</td>
                        <td className="py-2.5">
                          {row.avgAccuracy != null ? `${row.avgAccuracy}%` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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

          <Card>
            <CardTitle>All quizzes — performance summary</CardTitle>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="pb-2">Quiz</th>
                    <th className="pb-2">Created by</th>
                    <th className="pb-2">Grade</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Questions</th>
                    <th className="pb-2">Avg accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentQuizzes.map((q) => (
                    <tr key={q.id} className="border-t border-gray-100">
                      <td className="py-2.5 font-medium">{q.title}</td>
                      <td className="py-2.5">{formatQuizCreator(q) ?? '—'}</td>
                      <td className="py-2.5">{resolveQuizGrade(q) ?? '—'}</td>
                      <td className="py-2.5">{q.status}</td>
                      <td className="py-2.5">{q.questionCount ?? 0}</td>
                      <td className="py-2.5">
                        {q.avgAccuracy != null ? `${q.avgAccuracy}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
