import { useState } from 'react';
import { Trophy } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import type { LeaderboardEntry, LeaderboardScope } from '@/types/dashboard';

const MOCK: Record<LeaderboardScope, LeaderboardEntry[]> = {
  class: [
    { rank: 1, name: 'Aarav S.', score: 98, xp: 2100 },
    { rank: 2, name: 'Priya M.', score: 94, xp: 1980, isCurrentUser: true },
    { rank: 3, name: 'Rohan K.', score: 91, xp: 1850 },
    { rank: 4, name: 'Sneha T.', score: 88, xp: 1720 },
  ],
  school: [
    { rank: 1, name: 'Vikram D.', score: 99, xp: 3200 },
    { rank: 2, name: 'Aarav S.', score: 98, xp: 2100 },
    { rank: 3, name: 'Priya M.', score: 94, xp: 1980, isCurrentUser: true },
  ],
  global: [
    { rank: 1, name: 'National Champ', score: 100, xp: 5000 },
    { rank: 2, name: 'Quiz Master', score: 99, xp: 4800 },
    { rank: 3, name: 'Priya M.', score: 94, xp: 1980, isCurrentUser: true },
  ],
};

const TABS: { id: LeaderboardScope; label: string }[] = [
  { id: 'class', label: 'Class' },
  { id: 'school', label: 'School' },
  { id: 'global', label: 'Global' },
];

export function LeaderboardPanel() {
  const [scope, setScope] = useState<LeaderboardScope>('class');
  const entries = MOCK[scope];
  const podium = entries.slice(0, 3);

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning" /> Leaderboard
        </CardTitle>
        <div className="flex rounded-xl bg-surface p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setScope(tab.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                scope === tab.id ? 'bg-primary text-white shadow' : 'text-muted hover:text-ink',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-center gap-4">
        {[1, 0, 2].map((idx) => {
          const e = podium[idx];
          if (!e) return null;
          const heights = ['h-24', 'h-32', 'h-20'];
          return (
            <div key={e.rank} className="flex flex-col items-center">
              <div
                className={cn(
                  'flex w-20 flex-col items-center justify-end rounded-t-2xl bg-primary/10 pb-2',
                  heights[idx],
                )}
              >
                <span className="text-2xl font-bold text-primary">#{e.rank}</span>
              </div>
              <p className="mt-2 text-sm font-semibold">{e.name}</p>
              <p className="text-xs text-muted">{e.score}%</p>
            </div>
          );
        })}
      </div>

      <ul className="mt-6 space-y-2">
        {entries.map((e) => (
          <li
            key={e.rank}
            className={cn(
              'flex items-center justify-between rounded-xl px-4 py-2.5',
              e.isCurrentUser ? 'bg-primary/10 ring-1 ring-primary/20' : 'bg-surface',
            )}
          >
            <span className="font-medium">
              #{e.rank} {e.name}
            </span>
            <span className="text-sm text-muted">{e.score}% · {e.xp} XP</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
