import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { fetchStudentQuizDetail, type QuizProgressDetail } from '@/api/progress.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { formatDateTime, formatDuration } from '@/lib/formatDateTime';
import { getQuizSectionLabel } from '@/utils/quizMeta';
import type { QuizSummary } from '@/types/quiz';

export function StudentQuizProgressPage() {
  const { studentId, quizId } = useParams<{ studentId: string; quizId: string }>();
  const [detail, setDetail] = useState<QuizProgressDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!studentId || !quizId) return;
    setIsLoading(true);
    setError(null);
    fetchStudentQuizDetail(studentId, quizId)
      .then(setDetail)
      .catch((err) => {
        logApiError('Load quiz progress failed', err);
        setError(getApiErrorMessage(err, 'Could not load quiz details.'));
      })
      .finally(() => setIsLoading(false));
  }, [studentId, quizId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!studentId || !quizId) {
    return <p className="text-danger">Missing student or quiz id.</p>;
  }

  if (isLoading && !detail) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Link
          to={`/progress/students/${studentId}`}
          className="inline-flex items-center gap-1 text-sm text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to student
        </Link>
        <Card>
          <p className="text-danger">{error ?? 'Quiz not found.'}</p>
        </Card>
      </div>
    );
  }

  const { student, quiz, summary, questions } = detail;
  const quizMeta: QuizSummary = {
    id: quiz.id,
    classId: '',
    title: quiz.title,
    status: 'PUBLISHED',
    grade: quiz.grade,
    className: quiz.className,
  };
  const sectionLabel = getQuizSectionLabel(quizMeta);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to={`/progress/students/${studentId}`}
            className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {student.displayName}
          </Link>
          <h1 className="text-2xl font-bold text-ink">{quiz.title}</h1>
          <p className="text-muted">
            {quiz.subject}
            {quiz.topic ? ` · ${quiz.topic}` : ''} · {quiz.board} · Grade {quiz.grade}
            {sectionLabel ? ` · Section ${sectionLabel}` : ''}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-4">
          <p className="text-sm text-muted">Accuracy</p>
          <p className="text-2xl font-bold text-primary">{summary.accuracy}%</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Points earned</p>
          <p className="text-2xl font-bold">{summary.pointsEarned}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Answered</p>
          <p className="text-2xl font-bold">
            {summary.answeredCount}
            <span className="text-base font-normal text-muted"> / {quiz.questionCount}</span>
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Total time</p>
          <p className="text-lg font-semibold">{formatDuration(summary.totalTimeSpentSeconds)}</p>
        </Card>
      </div>

      <Card className="!p-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-muted">First answered</p>
            <p className="font-medium">{formatDateTime(summary.firstAnsweredAt)}</p>
          </div>
          <div>
            <p className="text-muted">Last answered</p>
            <p className="font-medium">{formatDateTime(summary.lastAnsweredAt)}</p>
          </div>
          <div>
            <p className="text-muted">Published</p>
            <p className="font-medium">{formatDateTime(quiz.publishedAt)}</p>
          </div>
          <div>
            <p className="text-muted">Status</p>
            <p className="font-medium">{summary.isComplete ? 'Complete' : 'In progress'}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardTitle>Question breakdown</CardTitle>
        <ul className="mt-4 space-y-4">
          {questions.map((q, idx) => (
            <li
              key={q.questionId}
              className="rounded-xl border border-gray-100 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-medium text-muted">Q{idx + 1}</p>
                <div className="flex items-center gap-2 text-sm">
                  {q.isCorrect === true && (
                    <span className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="h-4 w-4" />
                      Correct
                    </span>
                  )}
                  {q.isCorrect === false && (
                    <span className="inline-flex items-center gap-1 text-danger">
                      <XCircle className="h-4 w-4" />
                      Incorrect
                    </span>
                  )}
                  {q.isCorrect == null && (
                    <span className="text-muted">Not answered</span>
                  )}
                  <span className="text-muted">
                    · {q.pointsEarned}/{q.points} pts
                  </span>
                </div>
              </div>
              <p className="mt-2 text-ink">{q.questionText}</p>
              {q.selectedOptionIndex != null && (
                <p className="mt-2 text-sm text-muted">
                  Selected option: {q.selectedOptionIndex + 1}
                </p>
              )}
              <p className="mt-2 text-xs text-muted">
                Answered {formatDateTime(q.answeredAt)}
                {q.timeSpentSeconds != null && q.timeSpentSeconds > 0
                  ? ` · ${formatDuration(q.timeSpentSeconds)}`
                  : ''}
              </p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
