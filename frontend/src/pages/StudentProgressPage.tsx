import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RefreshCw, Search, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchProgressStudents,
  type ProgressStudentsQuery,
  type StudentProgressRow,
} from '@/api/progress.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { EngagementPanel } from '@/components/engagement/EngagementPanel';
import { formatActiveTime, formatDateTime } from '@/lib/formatDateTime';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';

export function StudentProgressPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isParent = role === 'PARENT';
  const canFilterClass = role === 'TEACHER' || role === 'SCHOOL_ADMIN' || role === 'SUPER_ADMIN';

  const { grades: gradeOptions, sections: sectionOptions } = useSchoolAcademics();
  const [items, setItems] = useState<StudentProgressRow[]>([]);
  const [filters, setFilters] = useState<ProgressStudentsQuery>({});
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    const query: ProgressStudentsQuery = { ...filters };
    if (searchInput.trim()) query.search = searchInput.trim();

    fetchProgressStudents(query)
      .then((res) => setItems(res.items))
      .catch((err) => {
        logApiError('Load student progress failed', err);
        setError(getApiErrorMessage(err, 'Could not load student progress.'));
      })
      .finally(() => setIsLoading(false));
  }, [filters, searchInput, filterVersion]);

  useEffect(() => {
    load();
  }, [load]);

  const derivedGrades = useMemo(
    () =>
      gradeOptions.length > 0
        ? gradeOptions
        : [...new Set(items.map((s) => s.grade).filter(Boolean) as string[])].sort(),
    [gradeOptions, items],
  );
  const derivedSections = useMemo(
    () =>
      sectionOptions.length > 0
        ? sectionOptions
        : [...new Set(items.map((s) => s.section).filter(Boolean) as string[])].sort(),
    [sectionOptions, items],
  );

  return (
    <div className="space-y-6">
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
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {canFilterClass && (
        <Card className="!p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-medium text-muted">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  placeholder="Name or email"
                  className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-3 text-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && load()}
                />
              </div>
            </div>
            <div className="min-w-[120px]">
              <label className="mb-1 block text-xs font-medium text-muted">Grade</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={filters.grade ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, grade: e.target.value || undefined }))
                }
              >
                <option value="">All grades</option>
                {derivedGrades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="mb-1 block text-xs font-medium text-muted">Section</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                value={filters.section ?? ''}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, section: e.target.value || undefined }))
                }
              >
                <option value="">All sections</option>
                {derivedSections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Button size="sm" onClick={load} disabled={isLoading}>
              Apply
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <Card>
          <p className="text-danger">{error}</p>
        </Card>
      )}

      {canFilterClass && <EngagementPanel />}

      <Card className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Student</th>
                {!isParent && <th className="px-4 py-3 font-medium">Grade</th>}
                {!isParent && <th className="px-4 py-3 font-medium">Section</th>}
                <th className="px-4 py-3 font-medium">Quizzes</th>
                <th className="px-4 py-3 font-medium">Accuracy</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium">Session time</th>
                <th className="px-4 py-3 font-medium">Last activity</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    Loading…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted">
                    No students match your filters.
                  </td>
                </tr>
              ) : (
                items.map((row) => (
                  <tr key={row.studentId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{row.displayName}</p>
                      <p className="text-xs text-muted">{row.email}</p>
                    </td>
                    {!isParent && (
                      <td className="px-4 py-3 text-muted">{row.grade ?? '—'}</td>
                    )}
                    {!isParent && (
                      <td className="px-4 py-3 text-muted">{row.section ?? '—'}</td>
                    )}
                    <td className="px-4 py-3">
                      <span className="font-medium">{row.quizzesCompleted}</span>
                      <span className="text-muted"> / {row.quizzesStarted} started</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {row.accuracy}%
                      </span>
                    </td>
                    <td className="px-4 py-3">{row.totalPointsEarned}</td>
                    <td className="px-4 py-3 text-muted" title={`${row.sessionCount} logins`}>
                      {formatActiveTime(row.totalActiveSeconds)}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(row.lastActivityAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/progress/students/${row.studentId}`}
                        className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
                      >
                        Details
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
