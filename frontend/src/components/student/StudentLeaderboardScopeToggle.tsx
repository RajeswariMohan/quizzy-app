import { cn } from '@/lib/cn';
import type { LeaderboardScopeKey } from '@/api/student.api';

export function formatStudentEnrollment(
  grade: string | null | undefined,
  section: string | null | undefined,
): string | null {
  const g = grade?.trim();
  const s = section?.trim();
  if (g && s) return `${g} · ${s}`;
  if (g) return g;
  if (s) return s;
  return null;
}

export function defaultLeaderboardScope(
  viewer: { grade: string | null; section: string | null },
): LeaderboardScopeKey {
  return viewer.section?.trim() ? 'section' : 'class';
}

interface StudentLeaderboardScopeToggleProps {
  grade: string;
  scope: LeaderboardScopeKey;
  onScopeChange: (scope: LeaderboardScopeKey) => void;
  className?: string;
}

export function StudentLeaderboardScopeToggle({
  grade,
  scope,
  onScopeChange,
  className,
}: StudentLeaderboardScopeToggleProps) {
  return (
    <div
      className={cn('grid grid-cols-2 gap-1 rounded-xl bg-surface p-1', className)}
      role="group"
      aria-label="Ranking scope"
    >
      {(
        [
          { key: 'class' as const, label: `All of ${grade}` },
          { key: 'section' as const, label: 'My section' },
        ] as const
      ).map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={scope === item.key}
          onClick={() => onScopeChange(item.key)}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-medium transition',
            scope === item.key
              ? 'bg-white text-ink shadow-sm'
              : 'text-muted hover:text-ink',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
