import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, RefreshCw, UserPlus, Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchSchoolAdminOverview } from '@/api/schoolAdmin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';

function usageLabel(used: number, max: number | null): string {
  if (max == null) return `${used} (no limit)`;
  return `${used} / ${max}`;
}

export function SchoolAdminDashboardPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchSchoolAdminOverview>> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchSchoolAdminOverview()
      .then(setData)
      .catch((err) => {
        logApiError('Load school overview failed', err);
        setError(getApiErrorMessage(err, 'Could not load school overview.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  const { school, limits, publishedQuizzes, avgAccuracy } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">{school.name}</h1>
          <p className="text-muted">School administration · onboard users and monitor usage</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-4">
          <div className="flex items-center gap-2 text-muted">
            <Users className="h-4 w-4" />
            <p className="text-sm">Students</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">
            {usageLabel(limits.usage.students, limits.maxStudents)}
          </p>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-2 text-muted">
            <Users className="h-4 w-4" />
            <p className="text-sm">Teachers</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">
            {usageLabel(limits.usage.teachers, limits.maxTeachers)}
          </p>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-2 text-muted">
            <Users className="h-4 w-4" />
            <p className="text-sm">Parents</p>
          </div>
          <p className="mt-2 text-2xl font-bold text-ink">
            {usageLabel(limits.usage.parents, limits.maxParents)}
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Published quizzes</p>
          <p className="mt-2 text-2xl font-bold text-ink">{publishedQuizzes}</p>
          <p className="mt-1 text-sm text-primary">Avg accuracy {avgAccuracy}%</p>
        </Card>
      </div>

      <Card>
        <CardTitle>Quick actions</CardTitle>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link to="/school-admin/users">
            <Button>
              <UserPlus className="h-4 w-4" />
              Onboard users
            </Button>
          </Link>
          <Link to="/school-admin/academics">
            <Button variant="outline">
              <GraduationCap className="h-4 w-4" />
              School academics
            </Button>
          </Link>
          <Link to="/teacher/analytics">
            <Button variant="outline">View school analytics</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
