import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, RefreshCw, Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  defaultDays?: number;
}

export function EngagementPanel({ defaultDays = 30 }: EngagementPanelProps) {
  const viewerRole = useAuthStore((s) => s.user?.role);
  const [data, setData] = useState<EngagementOverview | null>(null);
  const [filters, setFilters] = useState<EngagementQuery>({ days: defaultDays });
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
  }, [filters, filterVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const allowedRoles = useMemo<UserRole[]>(() => {
    if (viewerRole === 'TEACHER') {
      return ['STUDENT', 'TEACHER'];
    }
    return ALL_ROLES;
  }, [viewerRole]);

  const visibleByRole = useMemo(
    () => (data?.byRole ?? []).filter((row) => allowedRoles.includes(row.role)),
    [data?.byRole, allowedRoles],
  );

  const visibleUsers = useMemo(
    () => (data?.users ?? []).filter((row) => allowedRoles.includes(row.role)),
    [data?.users, allowedRoles],
  );

  const totalSeconds = visibleByRole.reduce((sum, row) => sum + row.totalActiveSeconds, 0);

  const roleCards = useMemo(() => {
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
  }, [visibleByRole, filters.role, allowedRoles]);

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
    resetKey: `${filters.days ?? defaultDays}|${filters.role ?? ''}|${visibleUsers.length}`,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink">Engagement (session time)</h2>
          <p className="text-sm text-muted">
            Active portal time for role-relevant users in your scope
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={filters.days ?? defaultDays}
            onChange={(e) =>
              setFilters((f) => ({ ...f, days: Number(e.target.value) }))
            }
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <select
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            value={filters.role ?? ''}
            onChange={(e) =>
              setFilters((f) => ({
                ...f,
                role: (e.target.value || undefined) as UserRole | undefined,
              }))
            }
          >
            <option value="">All roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            {allowedRoles.includes('SCHOOL_ADMIN') && (
              <option value="SCHOOL_ADMIN">School admins</option>
            )}
          </select>
          <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  Since {formatDateTime(data.since).split(',')[0]}
                </p>
              )}
            </Card>
            {roleCards.map((row) => (
              <Card key={row.role} className="!p-4">
                <p className="text-sm text-muted">{row.label}</p>
                <p className="text-xl font-bold">{formatActiveTime(row.totalActiveSeconds)}</p>
                <p className="text-xs text-muted">
                  {row.activeUsers} users · {row.sessionCount} sessions
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
                Session time is recorded when users sign in and use the portal. Ask staff,
                students, and parents to log in again after the latest update — activity will
                appear here within a few minutes.
              </p>
            </Card>
          )}

          {trendChartData.length > 0 && (
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
                  User session time
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
              {usersPagination.showPagination && (
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
