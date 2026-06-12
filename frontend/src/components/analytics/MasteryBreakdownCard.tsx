import { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { MasteryDonutChart } from '@/components/charts/MasteryDonutChart';
import { cn } from '@/lib/cn';
import type {
  SubjectMasteryRow,
  TeacherDashboardData,
  TopicMasteryRow,
} from '@/api/dashboard.api';
import type { MasterySlice } from '@/types/mastery';

type MasteryView = 'subject' | 'topic';

interface MasteryBreakdownCardProps {
  subjectPerformance: SubjectMasteryRow[];
  topicPerformance: TopicMasteryRow[];
  appliedFilters?: TeacherDashboardData['appliedFilters'];
}

function buildMasterySubtitle(
  applied?: TeacherDashboardData['appliedFilters'],
): string {
  const parts: string[] = [];
  if (applied?.grade) parts.push(applied.grade);
  if (applied?.section) parts.push(`Section ${applied.section}`);
  if (parts.length > 0) {
    return `${parts.join(' · ')} — student responses in this group`;
  }
  return 'All students at your school (apply grade and section above to narrow).';
}

function toSlices(rows: SubjectMasteryRow[] | TopicMasteryRow[], view: MasteryView): MasterySlice[] {
  if (view === 'subject') {
    return (rows as SubjectMasteryRow[]).map((row) => ({
      label: row.subject,
      score: row.score,
      answeredCount: row.answeredCount,
      correctCount: row.correctCount,
    }));
  }
  return (rows as TopicMasteryRow[]).map((row) => ({
    label: row.topic,
    score: row.score,
    answeredCount: row.answeredCount,
    correctCount: row.correctCount,
  }));
}

export function MasteryBreakdownCard({
  subjectPerformance,
  topicPerformance,
  appliedFilters,
}: MasteryBreakdownCardProps) {
  const [view, setView] = useState<MasteryView>('subject');
  const rows = view === 'subject' ? subjectPerformance : topicPerformance;
  const slices = toSlices(rows, view);
  const subtitle = buildMasterySubtitle(appliedFilters);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Mastery breakdown</CardTitle>
          <p className="mt-1 text-xs text-muted">{subtitle}</p>
        </div>
        <div
          className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1"
          role="group"
          aria-label="Mastery dimension"
        >
          {(
            [
              { key: 'subject' as const, label: 'By subject' },
              { key: 'topic' as const, label: 'By topic' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={view === item.key}
              onClick={() => setView(item.key)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition',
                view === item.key
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {slices.length > 0 ? (
        <>
          <div className="mt-3">
            <MasteryDonutChart data={slices} volumeContext="responses" />
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            {slices.map((row) => (
              <li key={row.label} className="flex justify-between gap-2">
                <span className="font-medium text-ink">{row.label}</span>
                <span className="shrink-0 text-muted">
                  {row.score}% · {row.correctCount}/{row.answeredCount} correct
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-6 text-sm text-muted">
          No {view === 'subject' ? 'subject' : 'topic'} data for the current filters yet.
        </p>
      )}
    </Card>
  );
}
