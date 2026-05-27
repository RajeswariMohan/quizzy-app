import { useEffect, useState } from 'react';
import { Flame, Play, Target, Trophy, Zap } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PerformanceLineChart } from '@/components/charts/PerformanceLineChart';
import { TopicDonutChart } from '@/components/charts/TopicDonutChart';
import { Link } from 'react-router-dom';
import { fetchStudentProgress, fetchStudentQuizzes, type StudentProgress } from '@/api/student.api';
import { logApiError } from '@/api/client';

export function StudentDashboard() {
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [quizzes, setQuizzes] = useState<Awaited<ReturnType<typeof fetchStudentQuizzes>>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchStudentProgress(), fetchStudentQuizzes()])
      .then(([p, q]) => {
        setProgress(p);
        setQuizzes(q);
      })
      .catch((err) => logApiError('Load student dashboard failed', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const name = progress?.displayName ?? 'Student';
  const xpPercent = progress
    ? Math.round((progress.xpInLevel / progress.xpToNextLevel) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Hi, {name} 👋</h1>
            <p className="mt-1 text-muted">
              {progress?.currentStreak
                ? `${progress.currentStreak}-day streak — keep it going!`
                : 'Take a quiz to start your streak!'}
            </p>
          </div>
          <Badge className="bg-warning/15 text-warning">Level {progress?.level ?? 1}</Badge>
        </div>

        <div className="mt-4">
          <div className="mb-1 flex justify-between text-sm">
            <span className="text-muted">
              {progress?.xpPoints ?? 0} XP ({progress?.xpInLevel ?? 0} /{' '}
              {progress?.xpToNextLevel ?? 500} this level)
            </span>
            <span className="font-medium text-primary">{xpPercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <Target className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold">{progress?.quizzesTaken ?? 0}</p>
            <p className="text-xs text-muted">Quizzes taken</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <Zap className="h-5 w-5 text-success" />
            <p className="mt-2 text-2xl font-bold">{progress?.accuracy ?? 0}%</p>
            <p className="text-xs text-muted">Accuracy</p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <Flame className="h-5 w-5 text-warning" />
            <p className="mt-2 text-2xl font-bold">{progress?.currentStreak ?? 0}</p>
            <p className="text-xs text-muted">Day streak</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Available quizzes</CardTitle>
        {quizzes.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            No quizzes for your grade and section yet. Ask your teacher to publish one, or
            confirm your grade and section on your profile.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {quizzes.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-ink">{q.title}</p>
                  <p className="text-xs text-muted">
                    {q.subject ?? 'General'}
                    {q.className ? ` · ${q.className}` : ''} · {q.answeredCount}/{q.questionCount}{' '}
                    answered
                  </p>
                </div>
                <Link to={`/student/quizzes/${q.id}`}>
                  <Button size="sm" variant={q.isComplete ? 'outline' : 'primary'}>
                    <Play className="h-4 w-4" />
                    {q.isComplete ? 'Review' : 'Start'}
                  </Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Performance over time</CardTitle>
          {progress?.performanceOverTime?.length ? (
            <PerformanceLineChart data={progress.performanceOverTime} />
          ) : (
            <p className="mt-4 text-sm text-muted">Answer questions to see your progress chart.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Topic mastery</CardTitle>
          {progress?.topicMastery?.length ? (
            <>
              <TopicDonutChart data={progress.topicMastery} />
              <ul className="mt-2 space-y-1 text-sm text-muted">
                {progress.topicMastery.map((t) => (
                  <li key={t.topic} className="flex justify-between">
                    <span>{t.topic}</span>
                    <span className="font-medium text-ink">{t.percentage}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-4 text-sm text-muted">Complete quizzes to unlock topic insights.</p>
          )}
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" /> Leaderboard
            </CardTitle>
            <p className="mt-1 text-sm text-muted">
              {progress?.xpPoints ?? 0} XP earned — see how you compare with classmates
            </p>
          </div>
          <Link to="/student/leaderboard">
            <Button variant="outline" size="sm">
              View full leaderboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
