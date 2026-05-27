import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClassBarChart } from '@/components/charts/ClassBarChart';
import { fetchSchoolAnalytics } from '@/api/admin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';

export function AdminAnalyticsPage() {
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const filterLabel = useSchoolFilterStore((s) => s.getFilterLabel());
  const [schools, setSchools] = useState<
    Awaited<ReturnType<typeof fetchSchoolAnalytics>>['schools']
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const studentChart = useMemo(
    () =>
      schools.map((s) => ({
        label: s.name.length > 12 ? `${s.name.slice(0, 10)}…` : s.name,
        value: s.students,
      })),
    [schools],
  );

  const accuracyChart = useMemo(
    () =>
      schools.map((s) => ({
        label: s.name.length > 12 ? `${s.name.slice(0, 10)}…` : s.name,
        value: s.avgAccuracy,
      })),
    [schools],
  );

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

      <Card>
        <CardTitle>Detailed comparison</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-muted">
                <th className="pb-2 pr-3 font-medium">School</th>
                <th className="pb-2 pr-3 font-medium">Students</th>
                <th className="pb-2 pr-3 font-medium">Teachers</th>
                <th className="pb-2 pr-3 font-medium">Parents</th>
                <th className="pb-2 pr-3 font-medium">Quizzes</th>
                <th className="pb-2 font-medium">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s.id} className="border-b border-gray-50">
                  <td className="py-2.5 pr-3 font-medium">{s.name}</td>
                  <td className="py-2.5 pr-3">{s.students}</td>
                  <td className="py-2.5 pr-3">{s.teachers}</td>
                  <td className="py-2.5 pr-3">{s.parents}</td>
                  <td className="py-2.5 pr-3">{s.publishedQuizzes}</td>
                  <td className="py-2.5">{s.avgAccuracy}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
