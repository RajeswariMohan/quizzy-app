import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PerformanceLineChart } from '@/components/charts/PerformanceLineChart';
import { TopicDonutChart } from '@/components/charts/TopicDonutChart';
import {
  fetchStudentOverview,
  fetchStudentQuizzes,
  type QuizProgressRow,
  type StudentOverview,
} from '@/api/progress.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { formatDateTime, formatDuration } from '@/lib/formatDateTime';
import { useClientPagination } from '@/hooks/useClientPagination';
import { TablePagination } from '@/components/ui/TablePagination';

export function StudentProgressDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [quizzes, setQuizzes] = useState<QuizProgressRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const quizzesPagination = useClientPagination(quizzes, {
    resetKey: `${studentId ?? ''}|${quizzes.length}`,
  });

  const load = useCallback(() => {
    if (!studentId) return;
    setIsLoading(true);
    setError(null);
    Promise.all([fetchStudentOverview(studentId), fetchStudentQuizzes(studentId)])
      .then(([ov, quizData]) => {
        setOverview(ov);
        setQuizzes(quizData.items);
      })
      .catch((err) => {
        logApiError('Load student progress detail failed', err);
        setError(getApiErrorMessage(err, 'Could not load student progress.'));
      })
      .finally(() => setIsLoading(false));
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!studentId) {
    return <p className="text-danger">Missing student id.</p>;
  }

  if (isLoading && !overview) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="space-y-4">
        <Link to="/progress" className="inline-flex items-center gap-1 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" />
          Back to progress
        </Link>
        <Card>
          <p className="text-danger">{error ?? 'Student not found.'}</p>
        </Card>
      </div>
    );
  }

  const { student, stats, topicMastery, performanceOverTime } = overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to="/progress"
            className="mb-2 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            All students
          </Link>
          <h1 className="text-2xl font-bold text-ink">{student.displayName}</h1>
          <p className="text-muted">
            {student.grade ? `Grade ${student.grade}` : 'Grade —'}
            {student.section ? ` · Section ${student.section}` : ''}
            {' · '}
            Level {student.level} · {student.xpPoints} XP · {student.currentStreak}-day streak
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="!p-4">
          <p className="text-sm text-muted">Overall accuracy</p>
          <p className="text-2xl font-bold text-primary">{stats.accuracy}%</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Quizzes completed</p>
          <p className="text-2xl font-bold">
            {stats.quizzesCompleted}
            <span className="text-base font-normal text-muted"> / {stats.quizzesStarted}</span>
          </p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Questions answered</p>
          <p className="text-2xl font-bold">{stats.totalAnswers}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-sm text-muted">Last activity</p>
          <p className="text-lg font-semibold">{formatDateTime(stats.lastActivityAt)}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>14-day accuracy trend</CardTitle>
          {performanceOverTime.length > 0 ? (
            <div className="mt-4">
              <PerformanceLineChart data={performanceOverTime} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No recent quiz activity.</p>
          )}
        </Card>
        <Card>
          <CardTitle>Topic mastery</CardTitle>
          {topicMastery.length > 0 ? (
            <div className="mt-4">
              <TopicDonutChart data={topicMastery} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">No topic data yet.</p>
          )}
        </Card>
      </div>

      <Card className="overflow-hidden !p-0">
        <div className="border-b border-gray-100 px-4 py-3">
          <CardTitle>Quiz attempts</CardTitle>
          <p className="text-sm text-muted">Score, completion, and timestamps per quiz</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-gray-100 bg-gray-50/80 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Quiz</th>
                <th className="px-4 py-3 font-medium">Subject / topic</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">First answered</th>
                <th className="px-4 py-3 font-medium">Last answered</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {quizzes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted">
                    No quiz attempts recorded yet.
                  </td>
                </tr>
              ) : (
                quizzesPagination.pageItems.map((q) => (
                  <tr key={q.quizId} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{q.title}</p>
                      <p className="text-xs text-muted">
                        {q.board} · Grade {q.grade}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {q.subject}
                      {q.topic ? ` · ${q.topic}` : ''}
                    </td>
                    <td className="px-4 py-3 text-muted">{q.className ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{q.accuracy}%</span>
                      <span className="text-muted">
                        {' '}
                        ({q.correctCount}/{q.answeredCount})
                      </span>
                      <p className="text-xs text-muted">{q.pointsEarned} pts</p>
                    </td>
                    <td className="px-4 py-3">
                      {q.isComplete ? (
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                          Complete
                        </span>
                      ) : (
                        <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                          In progress
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(q.firstAnsweredAt)}</td>
                    <td className="px-4 py-3 text-muted">{formatDateTime(q.lastAnsweredAt)}</td>
                    <td className="px-4 py-3 text-muted">
                      {formatDuration(q.totalTimeSpentSeconds)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/progress/students/${studentId}/quizzes/${q.quizId}`}
                        className="inline-flex items-center gap-0.5 text-sm font-medium text-primary hover:underline"
                      >
                        Questions
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {quizzesPagination.showPagination && quizzes.length > 0 && (
          <TablePagination
            page={quizzesPagination.page}
            totalPages={quizzesPagination.totalPages}
            pageSize={quizzesPagination.pageSize}
            totalItems={quizzesPagination.totalItems}
            rangeStart={quizzesPagination.rangeStart}
            rangeEnd={quizzesPagination.rangeEnd}
            onPageChange={quizzesPagination.setPage}
            onPageSizeChange={quizzesPagination.setPageSize}
          />
        )}
      </Card>
    </div>
  );
}
