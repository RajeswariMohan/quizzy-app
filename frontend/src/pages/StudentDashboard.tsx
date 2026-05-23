import { Flame, Star, Target, Zap } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PerformanceLineChart } from '@/components/charts/PerformanceLineChart';
import { TopicDonutChart } from '@/components/charts/TopicDonutChart';
import { LeaderboardPanel } from '@/components/student/LeaderboardPanel';
import { useAuthStore } from '@/store/authStore';
import type { BadgeItem, ChartPoint, TopicMastery } from '@/types/dashboard';

const PERFORMANCE: ChartPoint[] = [
  { label: 'Mon', value: 62 },
  { label: 'Tue', value: 68 },
  { label: 'Wed', value: 74 },
  { label: 'Thu', value: 71 },
  { label: 'Fri', value: 82 },
  { label: 'Sat', value: 88 },
  { label: 'Sun', value: 91 },
];

const TOPICS: TopicMastery[] = [
  { topic: 'Life Processes', percentage: 88 },
  { topic: 'Cells', percentage: 72 },
  { topic: 'Motion', percentage: 65 },
  { topic: 'Fractions', percentage: 54 },
];

const BADGES: BadgeItem[] = [
  { id: '1', title: 'Quiz Starter', description: 'Completed first quiz', earned: true, icon: 'zap' },
  { id: '2', title: 'Science Star', description: '90%+ in Science', earned: true, icon: 'star' },
  { id: '3', title: 'Streak Hero', description: '7-day streak', earned: false, progress: 86, icon: 'flame' },
  { id: '4', title: 'Top Scorer', description: 'Rank #1 in class', earned: false, progress: 40, icon: 'trophy' },
];

export function StudentDashboard() {
  const user = useAuthStore((s) => s.user);
  const name = user?.displayName ?? 'Student';

  return (
    <div className="space-y-6">
      {/* Greeting + gamification */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Hi, {name} 👋</h1>
            <p className="mt-1 text-muted">Keep your streak alive — one quiz away from Level 5!</p>
          </div>
          <Badge className="bg-warning/15 text-warning">Level 4</Badge>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted">1,250 / 2,000 XP</span>
            <span className="font-medium text-primary">62%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full w-[62%] rounded-full bg-primary" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <Target className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">24</p>
            <p className="text-xs text-muted">Quizzes taken</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <Zap className="h-5 w-5 text-success" />
            <p className="mt-2 text-2xl font-bold">76%</p>
            <p className="text-xs text-muted">Accuracy</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <Flame className="h-5 w-5 text-warning" />
            <p className="mt-2 text-2xl font-bold">6</p>
            <p className="text-xs text-muted">Day streak</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Performance over time</CardTitle>
          <PerformanceLineChart data={PERFORMANCE} />
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge className="bg-success/15 text-success">Strength: Life Processes</Badge>
            <Badge className="bg-danger/15 text-danger">Improve: Fractions</Badge>
          </div>
        </Card>

        <Card>
          <CardTitle>Topic mastery</CardTitle>
          <TopicDonutChart data={TOPICS} />
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {TOPICS.map((t) => (
              <li key={t.topic} className="flex justify-between">
                <span>{t.topic}</span>
                <span className="font-medium text-ink">{t.percentage}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-warning" /> Badges
        </CardTitle>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {BADGES.map((b) => (
            <div
              key={b.id}
              className={`flex flex-col items-center rounded-2xl border p-4 text-center ${
                b.earned ? 'border-primary/30 bg-primary/5' : 'border-gray-100 opacity-70'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
                {b.earned ? '★' : '○'}
              </div>
              <p className="mt-2 text-sm font-semibold">{b.title}</p>
              <p className="text-xs text-muted">{b.description}</p>
              {!b.earned && b.progress != null && (
                <p className="mt-1 text-xs text-primary">{b.progress}% progress</p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <LeaderboardPanel />
    </div>
  );
}
