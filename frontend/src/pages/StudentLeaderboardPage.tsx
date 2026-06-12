import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Trophy, UserCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import {
  fetchStudentAudienceOptions,
  fetchStudentLeaderboard,
  type LeaderboardScopeKey,
  type StudentLeaderboardResponse,
} from '@/api/student.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { LeaderboardScopeView } from '@/components/student/LeaderboardScopeView';
import {
  defaultLeaderboardScope,
  formatStudentEnrollment,
  StudentLeaderboardScopeToggle,
} from '@/components/student/StudentLeaderboardScopeToggle';

export function StudentLeaderboardPage() {
  const [viewerGrade, setViewerGrade] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [scope, setScope] = useState<LeaderboardScopeKey>('section');
  const [data, setData] = useState<StudentLeaderboardResponse | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudentAudienceOptions()
      .then((opts) => {
        setViewerGrade(opts.viewer.grade?.trim() || null);
        setEnrollment(formatStudentEnrollment(opts.viewer.grade, opts.viewer.section));
        setScope(defaultLeaderboardScope(opts.viewer));
        setProfileReady(true);
      })
      .catch((err) => logApiError('Load audience options failed', err));
  }, []);

  const loadLeaderboard = useCallback(() => {
    if (!viewerGrade) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    fetchStudentLeaderboard({ scope })
      .then(setData)
      .catch((err) => {
        logApiError('Load leaderboard failed', err);
        setError(getApiErrorMessage(err, 'Could not load leaderboard.'));
        setData(null);
      })
      .finally(() => setIsLoading(false));
  }, [viewerGrade, scope]);

  useEffect(() => {
    if (!profileReady) return;
    loadLeaderboard();
  }, [profileReady, loadLeaderboard]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-ink">
            <Trophy className="h-7 w-7 text-warning" aria-hidden />
            Class toppers
          </h1>
          <p className="mt-1 max-w-xl text-muted">
            Rankings for your enrolled class — compare with your whole grade or your section.
          </p>
          {enrollment && (
            <p className="mt-2 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              Your class: {enrollment}
            </p>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadLeaderboard} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          Refresh
        </Button>
      </header>

      {viewerGrade && (
        <Card className="sticky top-0 z-10 shadow-card">
          <p className="text-sm font-medium text-ink">Ranking scope</p>
          <p className="mt-0.5 text-xs text-muted">Based on your signup class — not changeable</p>
          <div className="mt-3">
            <StudentLeaderboardScopeToggle
              grade={viewerGrade}
              scope={scope}
              onScopeChange={setScope}
            />
          </div>
        </Card>
      )}

      {isLoading && (
        <Card className="flex min-h-[280px] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </Card>
      )}

      {!isLoading && error && (
        <Card className="border-danger/20 bg-danger/5">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={loadLeaderboard}>
            Try again
          </Button>
        </Card>
      )}

      {!isLoading && !error && profileReady && !viewerGrade && (
        <Card className="text-center">
          <UserCircle className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium text-ink">Set your class on your profile</p>
          <p className="mt-1 text-sm text-muted">
            Add your grade and section so we can show rankings for your enrolled class.
          </p>
          <Link to="/profile" className="mt-4 inline-block">
            <Button size="sm">Go to profile</Button>
          </Link>
        </Card>
      )}

      {!isLoading && !error && data && !data.filter && viewerGrade && (
        <Card className="text-center">
          <UserCircle className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium text-ink">No rankings for your class yet</p>
          <p className="mt-1 text-sm text-muted">
            When teachers publish quizzes for {viewerGrade}, class rankings will appear here.
          </p>
        </Card>
      )}

      {!isLoading && !error && data?.filter && (
        <Card className="min-h-[360px]">
          {!data.profileComplete && (
            <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-ink">
              <span className="font-medium">Tip:</span> Add your section on{' '}
              <Link to="/profile" className="font-medium text-primary underline">
                your profile
              </Link>{' '}
              to use &quot;My section&quot; rankings by default.
            </div>
          )}
          <LeaderboardScopeView
            headline={data.filter.headline}
            description={data.filter.description}
            entries={data.entries}
            showEnrollment={data.filter.scope === 'class'}
            fullPage
          />
        </Card>
      )}
    </div>
  );
}
