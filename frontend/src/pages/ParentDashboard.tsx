import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';
import { ActivityTimeline } from '@/components/parent/ActivityTimeline';
import { UpsellCard } from '@/components/parent/UpsellCard';
import {
  fetchLinkedChildren,
  fetchParentChildSummary,
  type LinkedChild,
  type ParentChildSummary,
} from '@/api/parent.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import type { ActivityEvent } from '@/types/dashboard';

function NoLinkedChildrenMessage() {
  return (
    <Card>
      <CardTitle>No linked students yet</CardTitle>
      <p className="mt-2 text-sm text-muted">
        Your child must register first and enter your email as their parent contact. When you sign
        up, use that same email and select the same school. If you already did and still see this
        message, verify the email and school match your child&apos;s signup details or contact your
        school administrator for help.
      </p>
    </Card>
  );
}

export function ParentDashboard() {
  const [children, setChildren] = useState<LinkedChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [summary, setSummary] = useState<ParentChildSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChildren = useCallback(async () => {
    const linked = await fetchLinkedChildren();
    setChildren(linked);
    setSelectedChildId((prev) => {
      if (prev && linked.some((c) => c.userId === prev)) return prev;
      return linked[0]?.userId ?? null;
    });
    return linked;
  }, []);

  const loadSummary = useCallback(async (studentId: string) => {
    const data = await fetchParentChildSummary(studentId);
    setSummary(data);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const linked = await loadChildren();
      if (linked.length === 0) {
        setSummary(null);
        return;
      }
      const id = linked[0].userId;
      await loadSummary(id);
    } catch (err) {
      logApiError('Load parent dashboard failed', err);
      setError(getApiErrorMessage(err, 'Could not load child progress.'));
    } finally {
      setIsLoading(false);
    }
  }, [loadChildren, loadSummary]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!selectedChildId) return;
    setIsLoading(true);
    loadSummary(selectedChildId)
      .catch((err) => {
        logApiError('Load child summary failed', err);
        setError(getApiErrorMessage(err, 'Could not load child progress.'));
      })
      .finally(() => setIsLoading(false));
  }, [selectedChildId, loadSummary]);

  if (isLoading && !summary && children.length === 0 && !error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isLoading && children.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Parent insights</h1>
          <p className="text-muted">View your child&apos;s quiz progress after they register</p>
        </div>
        <NoLinkedChildrenMessage />
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="space-y-6">
        <Card>
          <p className="text-danger">{error}</p>
        </Card>
        <NoLinkedChildrenMessage />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const { child, stats } = summary;
  const xpPercent =
    child.xpToNextLevel > 0
      ? Math.round((child.xpInLevel / child.xpToNextLevel) * 100)
      : 0;
  const quizXpPercent =
    stats.pointsAvailable > 0
      ? Math.round((stats.pointsEarned / stats.pointsAvailable) * 100)
      : 0;
  const events: ActivityEvent[] = summary.recentActivity.map((a) => ({
    id: a.id,
    title: a.title,
    description: a.description,
    timestamp: a.timestamp,
    type: a.type as ActivityEvent['type'],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Parent insights</h1>
          <p className="text-muted">{child.displayName}&apos;s learning journey</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/progress/students/${child.userId}`}
            className="rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10"
          >
            Detailed progress
          </Link>
        {children.length > 1 && (
          <select
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={selectedChildId ?? child.userId}
            onChange={(e) => setSelectedChildId(e.target.value)}
          >
            {children.map((c) => (
              <option key={c.userId} value={c.userId}>
                {c.displayName}
              </option>
            ))}
          </select>
        )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-4">
          <p className="text-sm text-muted">Overall accuracy</p>
          <p className="text-2xl font-bold text-primary">{stats.accuracy}%</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Quizzes taken</p>
          <p className="text-2xl font-bold">{stats.quizzesTaken}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Active streak</p>
          <p className="text-2xl font-bold text-warning">{child.currentStreak} days</p>
        </Card>
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">{child.displayName}&apos;s XP</p>
            <p className="text-2xl font-bold text-ink">
              {child.xpPoints}
              <span className="ml-2 text-base font-normal text-muted">lifetime total</span>
            </p>
          </div>
          <span className="rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Level {child.level}
          </span>
        </div>
        {stats.pointsAvailable > 0 ? (
          <p className="mt-2 text-sm text-muted">
            Earned{' '}
            <span className="font-medium text-ink">
              {stats.pointsEarned} of {stats.pointsAvailable} XP
            </span>{' '}
            on questions answered ({quizXpPercent}%)
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No quiz answers yet — XP will show here once {child.displayName} starts quizzes.
          </p>
        )}
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>
              {child.xpInLevel} / {child.xpToNextLevel} XP toward level {child.level + 1}
            </span>
            <span className="font-medium text-primary">{xpPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </Card>

      <UpsellCard />

      <Card>
        <CardTitle>Recent activity</CardTitle>
        {events.length > 0 ? (
          <ActivityTimeline events={events} />
        ) : (
          <p className="mt-3 text-sm text-muted">No quiz activity recorded yet.</p>
        )}
      </Card>
    </div>
  );
}
