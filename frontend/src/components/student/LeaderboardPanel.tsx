import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { fetchStudentLeaderboard, type LeaderboardEntryApi } from '@/api/student.api';
import { getApiErrorMessage, logApiError } from '@/api/client';

interface LeaderboardPanelProps {
  /** When true, uses larger layout for the dedicated leaderboard route. */
  fullPage?: boolean;
}

export function LeaderboardPanel({ fullPage = false }: LeaderboardPanelProps) {
  const [entries, setEntries] = useState<LeaderboardEntryApi[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchStudentLeaderboard()
      .then(setEntries)
      .catch((err) => {
        logApiError('Load leaderboard failed', err);
        setError(getApiErrorMessage(err, 'Could not load leaderboard.'));
        setEntries([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const podium = entries.slice(0, 3);
  const podiumOrder = podium.length >= 3 ? [1, 0, 2] : podium.map((_, i) => i);

  return (
    <Card className={fullPage ? 'min-h-[420px]' : undefined}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" /> School leaderboard
        </CardTitle>
        <Button variant="outline" size="sm" onClick={loadLeaderboard} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="mt-8 flex justify-center py-12">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && error && (
        <div className="mt-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadLeaderboard}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="mt-6 rounded-xl bg-surface px-4 py-8 text-center">
          <p className="font-medium text-ink">No rankings yet</p>
          <p className="mt-1 text-sm text-muted">
            Complete a quiz to earn XP and appear on the leaderboard.
          </p>
        </div>
      )}

      {!isLoading && !error && entries.length > 0 && (
        <>
          {podium.length > 0 && (
            <div
              className={cn(
                'mt-6 flex items-end justify-center gap-4',
                fullPage && 'min-h-[180px]',
              )}
            >
              {podiumOrder.map((idx, displayIdx) => {
                const e = podium[idx];
                if (!e) return null;
                const heights =
                  podium.length === 1
                    ? ['h-32']
                    : podium.length === 2
                      ? ['h-28', 'h-32']
                      : ['h-24', 'h-32', 'h-20'];
                const height = heights[displayIdx] ?? 'h-24';

                return (
                  <div key={e.userId} className="flex flex-col items-center">
                    <div
                      className={cn(
                        'flex w-20 flex-col items-center justify-end rounded-t-2xl bg-primary/10 pb-2 sm:w-24',
                        height,
                      )}
                    >
                      <span className="text-2xl font-bold text-primary">#{e.rank}</span>
                    </div>
                    <p className="mt-2 max-w-[100px] truncate text-center text-sm font-semibold">
                      {e.name}
                      {e.isCurrentUser && (
                        <span className="block text-xs font-normal text-primary">You</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">{e.xp} XP</p>
                  </div>
                );
              })}
            </div>
          )}

          <ul className="mt-6 space-y-2">
            {entries.map((e) => (
              <li
                key={e.userId}
                className={cn(
                  'flex items-center justify-between rounded-xl px-4 py-3',
                  e.isCurrentUser ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-surface',
                )}
              >
                <div className="min-w-0">
                  <span className="font-medium">
                    #{e.rank} {e.name}
                    {e.isCurrentUser && (
                      <span className="ml-2 text-xs text-primary">(you)</span>
                    )}
                  </span>
                  <p className="text-xs text-muted">
                    {e.score > 0 ? `${e.score}% accuracy` : 'No answers yet'}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-primary">{e.xp} XP</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
