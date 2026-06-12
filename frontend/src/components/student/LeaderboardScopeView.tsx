import { Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LeaderboardEntryApi } from '@/api/student.api';

function enrollmentLabel(grade: string | null, section: string | null): string | null {
  if (!grade && !section) return null;
  if (grade && section) return `${grade} · ${section}`;
  return grade ?? section;
}

interface LeaderboardScopeViewProps {
  headline: string;
  description: string;
  entries: LeaderboardEntryApi[];
  showEnrollment?: boolean;
  fullPage?: boolean;
}

export function LeaderboardScopeView({
  headline,
  description,
  entries,
  showEnrollment = false,
  fullPage = false,
}: LeaderboardScopeViewProps) {
  const podium = entries.slice(0, 3);
  const podiumOrder = podium.length >= 3 ? [1, 0, 2] : podium.map((_, i) => i);

  if (entries.length === 0) {
    return (
      <div className="mt-4 rounded-xl bg-surface px-4 py-8 text-center">
        <p className="font-medium text-ink">No rankings in this group yet</p>
        <p className="mt-1 text-sm text-muted">
          Complete a quiz published for {headline} to earn XP and appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-lg font-semibold text-ink">{headline}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>

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
                  <Trophy className="mb-1 h-4 w-4 text-warning" />
                  <span className="text-2xl font-bold text-primary">#{e.rank}</span>
                </div>
                <p className="mt-2 max-w-[110px] truncate text-center text-sm font-semibold">
                  {e.name}
                  {e.isCurrentUser && (
                    <span className="block text-xs font-normal text-primary">You</span>
                  )}
                </p>
                <p className="text-xs text-muted">{e.xp} XP</p>
                {showEnrollment && enrollmentLabel(e.grade, e.section) && (
                  <p className="max-w-[110px] truncate text-center text-[10px] text-muted">
                    {enrollmentLabel(e.grade, e.section)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {entries.map((e) => (
          <LeaderboardRow key={e.userId} entry={e} showEnrollment={showEnrollment} />
        ))}
      </ul>
    </>
  );
}

function LeaderboardRow({
  entry: e,
  showEnrollment,
}: {
  entry: LeaderboardEntryApi;
  showEnrollment: boolean;
}) {
  const group = enrollmentLabel(e.grade, e.section);

  return (
    <li
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl px-4 py-3',
        e.isCurrentUser ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-surface',
      )}
    >
      <div className="min-w-0">
        <span className="font-medium">
          #{e.rank} {e.name}
          {e.isCurrentUser && <span className="ml-2 text-xs text-primary">(you)</span>}
        </span>
        <p className="text-xs text-muted">
          {e.score > 0 ? `${e.score}% accuracy` : 'No answers yet'}
          {showEnrollment && group ? ` · ${group}` : ''}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-primary">{e.xp} XP</span>
    </li>
  );
}
