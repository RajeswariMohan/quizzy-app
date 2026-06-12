import { useEffect, useState } from 'react';
import { Flame, Target, Trophy, Zap } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PerformanceLineChart } from '@/components/charts/PerformanceLineChart';
import { SubjectDonutChart } from '@/components/charts/SubjectDonutChart';
import { Link } from 'react-router-dom';
import { fetchStudentProgress, type StudentProgress } from '@/api/student.api';
import { StudentQuizzesPanel } from '@/components/student/StudentQuizzesPanel';
import { logApiError } from '@/api/client';
import { useSchoolFeatures } from '@/hooks/useSchoolFeatures';

export function StudentDashboard() {
  const { features } = useSchoolFeatures();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStudentProgress()
      .then(setProgress)
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
              {features.gamificationEnabled
                ? progress?.currentStreak
                  ? `${progress.currentStreak}-day streak — keep it going!`
                  : 'Take a quiz to start your streak!'
                : 'Track your quiz progress below.'}
            </p>
          </div>
          {features.gamificationEnabled && (
            <Badge className="bg-warning/15 text-warning">Level {progress?.level ?? 1}</Badge>
          )}
        </div>

        {features.gamificationEnabled && (
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
        )}

        <div className={`mt-6 grid gap-4 ${features.gamificationEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
          {features.gamificationEnabled && (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <Flame className="h-5 w-5 text-warning" />
            <p className="mt-2 text-2xl font-bold">{progress?.currentStreak ?? 0}</p>
            <p className="text-xs text-muted">Day streak</p>
          </div>
          )}
        </div>
      </Card>

      <StudentQuizzesPanel />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>14-day accuracy</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Daily share of your answers that were correct (last 14 days).
          </p>
          {progress?.performanceOverTime?.length ? (
            <div className="mt-3">
              <PerformanceLineChart
                data={progress.performanceOverTime}
                valueLabel="Accuracy"
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Answer questions to see your accuracy trend.</p>
          )}
        </Card>

        <Card>
          <CardTitle>Performance by subject</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Your accuracy and practice split by subject (only your answers).
          </p>
          {progress?.subjectPerformance?.length ? (
            <div className="mt-3">
              <SubjectDonutChart data={progress.subjectPerformance} />
              <ul className="mt-3 space-y-1.5 text-sm">
                {progress.subjectPerformance.map((row) => (
                  <li key={row.subject} className="flex justify-between gap-2">
                    <span className="font-medium text-ink">{row.subject}</span>
                    <span className="shrink-0 text-muted">
                      {row.score}% · {row.correctCount}/{row.answeredCount} correct
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Start a quiz to see subject breakdown.</p>
          )}
        </Card>
      </div>

      {features.studentLeaderboardEnabled && (
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-warning" /> Leaderboard
            </CardTitle>
            <p className="mt-1 text-sm text-muted">
              {features.gamificationEnabled
                ? `${progress?.xpPoints ?? 0} XP — class & section toppers at your school`
                : 'Class and section rankings for your grade'}
            </p>
          </div>
          <Link to="/student/leaderboard">
            <Button variant="outline" size="sm">
              View toppers
            </Button>
          </Link>
        </div>
      </Card>
      )}
    </div>
  );
}
