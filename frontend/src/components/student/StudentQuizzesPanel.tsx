import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchStudentAudienceOptions,
  fetchStudentQuizzes,
  type StudentQuizListItem,
} from '@/api/student.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { formatStudentEnrollment } from '@/components/student/StudentLeaderboardScopeToggle';

export function StudentQuizzesPanel() {
  const [quizzes, setQuizzes] = useState<StudentQuizListItem[]>([]);
  const [enrollment, setEnrollment] = useState<string | null>(null);
  const [profileComplete, setProfileComplete] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchStudentQuizzes()
      .then((res) => setQuizzes(res.items))
      .catch((err) => {
        logApiError('Load quizzes failed', err);
        setError(getApiErrorMessage(err, 'Could not load quizzes.'));
        setQuizzes([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchStudentAudienceOptions()
      .then((opts) => {
        setEnrollment(formatStudentEnrollment(opts.viewer.grade, opts.viewer.section));
        setProfileComplete(Boolean(opts.viewer.grade?.trim() && opts.viewer.section?.trim()));
      })
      .catch((err) => logApiError('Load audience options failed', err));
    loadQuizzes();
  }, [loadQuizzes]);

  return (
    <Card>
      <CardTitle>Available quizzes</CardTitle>
      <p className="mt-1 text-sm text-muted">
        Quizzes published for your class and school.
      </p>

      {enrollment && (
        <p className="mt-3 inline-flex rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          Your class: {enrollment}
        </p>
      )}

      {!profileComplete && !enrollment && (
        <div className="mt-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-ink">
          <span className="font-medium">Complete your profile</span> — add your grade and section so
          we can show class-specific quizzes.{' '}
          <Link to="/profile" className="font-medium text-primary underline">
            Go to profile
          </Link>
        </div>
      )}

      {isLoading && (
        <div className="mt-6 flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && error && (
        <p className="mt-4 text-sm text-danger">{error}</p>
      )}

      {!isLoading && !error && quizzes.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          No quizzes are available for you yet. Check back when your teacher publishes one for your
          class or school.
        </p>
      )}

      {!isLoading && !error && quizzes.length > 0 && (
        <ul className="mt-4 space-y-3" data-testid="student-quiz-list">
          {quizzes.map((q) => (
            <li
              key={q.id}
              data-testid={`student-quiz-item-${q.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">{q.title}</p>
                <p className="text-xs text-muted">
                  {q.subject ?? 'General'}
                  {q.audienceLabel ? ` · For ${q.audienceLabel}` : ''}
                  {q.className ? ` · ${q.className}` : ''} · {q.answeredCount}/{q.questionCount}{' '}
                  answered
                </p>
              </div>
              <Link to={`/student/quizzes/${q.id}`}>
                <Button
                  size="sm"
                  variant={q.isComplete ? 'outline' : 'primary'}
                  data-testid={`student-quiz-start-${q.id}`}
                >
                  <Play className="h-4 w-4" />
                  {q.isComplete ? 'Review' : 'Start'}
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
