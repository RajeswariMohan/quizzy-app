import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, ChevronRight, RefreshCw, UserCheck } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchTeacherDashboard, type TeacherDashboardData } from '@/api/dashboard.api';
import {
  approvePendingSignup,
  fetchPendingSignups,
  type PendingSignupRow,
} from '@/api/signupApproval.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { formatQuizActivityAt } from '@/utils/quizMeta';

export function TeacherDashboard() {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [pendingSignups, setPendingSignups] = useState<PendingSignupRow[]>([]);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [pendingError, setPendingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const filterLabel = useSchoolFilterStore((s) => s.getFilterLabel());
  const isSuperAdmin = useAuthStore((s) => s.user?.role === 'SUPER_ADMIN');

  const loadDashboard = useCallback(() => {
    setIsLoading(true);
    setPendingError(null);
    Promise.all([
      fetchTeacherDashboard(),
      fetchPendingSignups().catch((err) => {
        logApiError('Load pending signups failed', err);
        return [] as PendingSignupRow[];
      }),
    ])
      .then(([dashboard, pending]) => {
        setData(dashboard);
        setPendingSignups(pending);
      })
      .catch((err) => logApiError('Load teacher dashboard failed', err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleApprovePending = async (row: PendingSignupRow) => {
    const name = `${row.firstName} ${row.lastName}`.trim();
    if (!window.confirm(`Approve ${name}? They will be able to sign in.`)) return;
    setPendingActionId(row.id);
    setPendingError(null);
    try {
      await approvePendingSignup(row.id);
      setPendingSignups((prev) => prev.filter((p) => p.id !== row.id));
      loadDashboard();
    } catch (err) {
      logApiError('Approve pending signup failed', err);
      setPendingError(getApiErrorMessage(err, 'Could not approve signup.'));
    } finally {
      setPendingActionId(null);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [filterVersion, loadDashboard]);

  const stats = data
    ? [
        { label: 'Students', value: String(data.stats.totalStudents) },
        { label: 'Published quizzes', value: String(data.stats.quizzesConducted) },
        { label: 'Avg accuracy', value: `${data.stats.avgAccuracy}%` },
        { label: 'Top score', value: data.stats.topScore },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-muted">
            {isSuperAdmin
              ? `Platform overview · ${filterLabel}`
              : 'Overview of your school tenant'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboard} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoading && !data ? (
        <div className="flex min-h-[20vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <Card key={s.label} className="!p-4">
                <p className="text-sm text-muted">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-ink">{s.value}</p>
              </Card>
            ))}
          </div>

          {pendingSignups.length > 0 && (
            <Card>
              <CardTitle>Pending student signups</CardTitle>
              <p className="mt-1 text-sm text-muted">
                Students who joined via your school link are waiting for approval.
              </p>
              {pendingError && (
                <p className="mt-2 text-sm text-danger" role="alert">
                  {pendingError}
                </p>
              )}
              <ul className="mt-3 space-y-2 text-sm">
                {pendingSignups.map((row) => {
                  const busy = pendingActionId === row.id;
                  const name = `${row.firstName} ${row.lastName}`.trim();
                  return (
                    <li
                      key={row.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{name}</p>
                        <p className="text-xs text-muted">
                          {row.username ?? row.email}
                          {row.grade ? ` · ${row.grade}` : ''}
                          {row.section ? ` ${row.section}` : ''}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleApprovePending(row)}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        {busy ? 'Approving…' : 'Approve'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Link to="/teacher/quizzes">
              <Card className="flex h-full items-center justify-between transition hover:border-primary/30 hover:shadow-md">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Quizzes
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted">
                    Create quizzes, add manual & AI questions, publish to class
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
              </Card>
            </Link>
            <Link to="/teacher/analytics">
              <Card className="flex h-full items-center justify-between transition hover:border-primary/30 hover:shadow-md">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Analytics
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted">
                    Topic mastery, quiz trends, and top student rankings
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted" />
              </Card>
            </Link>
          </div>

          <Card>
            <CardTitle>Recent activity</CardTitle>
            <ul className="mt-3 space-y-2 text-sm">
              {(data?.recentQuizzes ?? []).slice(0, 5).map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-lg bg-surface px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-ink">
                      {q.title}{' '}
                      <span className="font-normal text-muted">({q.status.toLowerCase()})</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {q.status === 'PUBLISHED' ? 'Published' : 'Updated'}{' '}
                      {formatQuizActivityAt(q)}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted">{q.questionCount ?? 0} Qs</span>
                </li>
              ))}
              {!data?.recentQuizzes?.length && (
                <li className="text-muted">No quizzes yet — open Quizzes to create one.</li>
              )}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}
