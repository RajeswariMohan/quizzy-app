import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  fetchEngagementOverview,
  type EngagementOverview,
  type EngagementQuery,
} from '@/api/engagement.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { formatActiveTime, formatDateTime } from '@/lib/formatDateTime';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';
import { useClientPagination } from '@/hooks/useClientPagination';
import { TablePagination } from '@/components/ui/TablePagination';

const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Students',
  TEACHER: 'Teachers',
  SCHOOL_ADMIN: 'School admins',
};

const ALL_ROLES: UserRole[] = ['STUDENT', 'TEACHER', 'SCHOOL_ADMIN'];

interface EngagementPanelProps {
  /** Applied engagement filters (typically committed from the page filter bar). */
  filters: EngagementQuery;
  /** Increment to re-fetch with the same filters (e.g. page Refresh). */
  refreshKey?: number;
}

export function EngagementPanel({ filters, refreshKey = 0 }: EngagementPanelProps) {
  const viewerRole = useAuthStore((s) => s.user?.role);
  const isTeacher = viewerRole === 'TEACHER';
  const [data, setData] = useState<EngagementOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchEngagementOverview(filters)
      .then(setData)
      .catch((err) => {
        logApiError('Load engagement failed', err);
        setError(getApiErrorMessage(err, 'Could not load engagement data.'));
        setData(null);
      })
      .finally(() => setIsLoading(false));
  }, [filters, filterVersion, refreshKey]);

  useEffect(() => {
    load();
  }, [load]);

  const allowedRoles = useMemo<UserRole[]>(() => {
    if (isTeacher) {
      return ['TEACHER'];
    }
    return ALL_ROLES;
  }, [isTeacher]);

  const visibleByRole = useMemo(
    () => (data?.byRole ?? []).filter((row) => allowedRoles.includes(row.role)),
    [data?.byRole, allowedRoles],
  );

  const visibleUsers = useMemo(() => data?.users ?? [], [data?.users]);

  const totalSeconds = isTeacher
    ? (visibleUsers[0]?.totalActiveSeconds ?? 0)
    : visibleByRole.reduce((sum, row) => sum + row.totalActiveSeconds, 0);

  const roleCards = useMemo(() => {
    if (isTeacher) {
      const self = visibleUsers[0];
      return [
        {
          role: 'TEACHER' as const,
          label: 'My active time',
          totalActiveSeconds: self?.totalActiveSeconds ?? 0,
          activeUsers: self ? 1 : 0,
          sessionCount: self?.sessionCount ?? 0,
          avgSessionSeconds:
            self && self.sessionCount > 0
              ? Math.round(self.totalActiveSeconds / self.sessionCount)
              : 0,
        },
      ];
    }
    const byRoleMap = new Map(visibleByRole.map((r) => [r.role, r]));
    const roles =
      filters.role && allowedRoles.includes(filters.role)
        ? [filters.role]
        : allowedRoles;
    return roles.map((role) => {
      const row = byRoleMap.get(role);
      return {
        role,
        label: ROLE_LABELS[role] ?? role,
        totalActiveSeconds: row?.totalActiveSeconds ?? 0,
        activeUsers: row?.activeUsers ?? 0,
        sessionCount: row?.sessionCount ?? 0,
        avgSessionSeconds: row?.avgSessionSeconds ?? 0,
      };
    });
  }, [visibleByRole, filters.role, allowedRoles, isTeacher, visibleUsers]);

  const trendChartData = useMemo(
    () =>
      (data?.dailyTrend ?? []).map((point) => ({
        label: point.date.slice(5),
        value: Math.round(point.activeSeconds / 60),
      })),
    [data?.dailyTrend],
  );

  const hasSessionData = totalSeconds > 0 || visibleUsers.length > 0;

  const usersPagination = useClientPagination(visibleUsers, {
    resetKey: `${filters.dateFrom ?? ''}|${filters.dateTo ?? ''}|${filters.role ?? ''}|${visibleUsers.length}`,
  });

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Calendar className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-ink">Engagement (session time)</h2>
          <p className="text-sm text-muted">
            {isTeacher
              ? 'Your portal session time in the selected date range'
              : 'Active portal time for role-relevant users in your scope'}
            {data && (
              <span className="mt-1 block text-xs">
                {data.dateFrom} – {data.dateTo}
              </span>
            )}
          </p>
        </div>
      </div>

      {error && (
        <Card>
          <p className="text-danger">{error}</p>
        </Card>
      )}

      {isLoading && !data ? (
        <Card className="!p-8 text-center text-sm text-muted">Loading engagement…</Card>
      ) : (
        <>
          <div
            className={`grid gap-4 ${isTeacher ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}
          >
            {!isTeacher && (
              <Card className="!p-4">
                <p className="flex items-center gap-1 text-sm text-muted">
                  <Clock className="h-4 w-4" />
                  Total active time
                </p>
                <p className="text-2xl font-bold text-primary">
                  {formatActiveTime(totalSeconds)}
                </p>
                {data && (
                  <p className="mt-1 text-xs text-muted">
                    {data.dateFrom} – {data.dateTo}
                  </p>
                )}
              </Card>
            )}
            {roleCards.map((row) => (
              <Card key={row.role} className="!p-4">
                <p className="text-sm text-muted">{row.label}</p>
                <p className="text-xl font-bold">{formatActiveTime(row.totalActiveSeconds)}</p>
                <p className="text-xs text-muted">
                  {row.sessionCount} sessions
                  {row.sessionCount > 0
                    ? ` · avg ${formatActiveTime(row.avgSessionSeconds)}`
                    : ''}
                </p>
              </Card>
            ))}
          </div>

          {!hasSessionData && !error && (
            <Card className="!p-6 text-center">
              <p className="font-medium text-ink">No session data in this period</p>
              <p className="mt-2 text-sm text-muted">
                {isTeacher
                  ? 'Sign in and use the portal during this range — your session time will appear here.'
                  : 'Session time is recorded when users sign in and use the portal. Activity will appear here within a few minutes.'}
              </p>
            </Card>
          )}

          {!isTeacher && trendChartData.length > 0 && (
            <Card>
              <CardTitle>Daily active time (minutes)</CardTitle>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                    <Tooltip
                      formatter={(value: number) => [`${value} min`, 'Active time']}
                    />
                    <Bar
                      dataKey="value"
                      fill="var(--color-primary-hex, #5D5FEF)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {data && visibleUsers.length > 0 && (
            <Card className="overflow-hidden !p-0">
              <div className="border-b border-gray-100 px-4 py-3">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {isTeacher ? 'My session time' : 'User session time'}
                </CardTitle>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-3 font-medium">User</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Active time</th>
                      <th className="px-4 py-3 font-medium">Sessions</th>
                      <th className="px-4 py-3 font-medium">Last login</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersPagination.pageItems.map((u) => (
                      <tr key={u.userId} className="border-b border-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{u.displayName}</p>
                          <p className="text-xs text-muted">{u.email}</p>
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {ROLE_LABELS[u.role] ?? u.role}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {formatActiveTime(u.totalActiveSeconds)}
                        </td>
                        <td className="px-4 py-3">{u.sessionCount}</td>
                        <td className="px-4 py-3 text-muted">
                          {formatDateTime(u.lastLoginAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!isLoading && usersPagination.totalItems > 0 && (
                <TablePagination
                  page={usersPagination.page}
                  totalPages={usersPagination.totalPages}
                  pageSize={usersPagination.pageSize}
                  totalItems={usersPagination.totalItems}
                  rangeStart={usersPagination.rangeStart}
                  rangeEnd={usersPagination.rangeEnd}
                  onPageChange={usersPagination.setPage}
                  onPageSizeChange={usersPagination.setPageSize}
                />
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
