import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchStudentQuiz,
  submitStudentResponse,
  type StudentQuizDetail,
  type StudentQuizQuestion,
  type SubmitResponseResult,
} from '@/api/student.api';
import { getApiErrorMessage, logApiError } from '@/api/client';

function priorToFeedback(
  question: StudentQuizQuestion,
): SubmitResponseResult | null {
  if (question.selectedOptionIndex == null || !question.priorAnswer) {
    return null;
  }
  return {
    questionId: question.id,
    isCorrect: question.priorAnswer.isCorrect,
    pointsEarned: question.priorAnswer.pointsEarned,
    correctOptionIndex: question.priorAnswer.correctOptionIndex,
    explanation: question.priorAnswer.explanation,
  };
}

export function StudentTakeQuizPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<StudentQuizDetail | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [feedback, setFeedback] = useState<SubmitResponseResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!quizId) return;
    setIsLoading(true);
    fetchStudentQuiz(quizId)
      .then(setQuiz)
      .catch((err) => {
        logApiError('Load quiz failed', err);
        setLoadError('Could not load this quiz.');
      })
      .finally(() => setIsLoading(false));
  }, [quizId]);

  const question = quiz?.questions[activeIndex];
  const selected =
    question?.selectedOptionIndex != null ? Number(question.selectedOptionIndex) : null;
  const alreadyAnswered = selected !== null;

  const priorFeedback = useMemo(
    () => (question ? priorToFeedback(question) : null),
    [question],
  );

  const displayFeedback = feedback ?? priorFeedback;

  useEffect(() => {
    setSubmitError(null);
    setFeedback(null);
  }, [activeIndex]);

  const handleSelect = async (optionIndex: number) => {
    if (!quizId || !question || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);
    setSubmitError(null);
    try {
      const result = await submitStudentResponse(quizId, {
        questionId: question.id,
        selectedOptionIndex: optionIndex,
      });
      setFeedback(result);
      setQuiz((prev) => {
        if (!prev) return prev;
        const questions = prev.questions.map((q) =>
          q.id === question.id
            ? {
                ...q,
                selectedOptionIndex: optionIndex,
                priorAnswer: {
                  isCorrect: result.isCorrect,
                  pointsEarned: result.pointsEarned,
                  correctOptionIndex: result.correctOptionIndex,
                  explanation: result.explanation,
                },
              }
            : q,
        );
        return { ...prev, questions };
      });
    } catch (err) {
      logApiError('Submit answer failed', err);
      setSubmitError(getApiErrorMessage(err, 'Could not save your answer.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const goPrevious = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  const goNext = () => {
    if (!quiz) return;
    if (activeIndex < quiz.questions.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      navigate('/student');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (loadError || !quiz) {
    return (
      <Card>
        <p className="text-danger">{loadError ?? 'Quiz not found'}</p>
        <Link to="/student" className="mt-4 inline-block text-primary">
          ← Back to dashboard
        </Link>
      </Card>
    );
  }

  if (quiz.questions.length === 0) {
    return (
      <Card>
        <p className="text-muted">This quiz has no questions yet.</p>
        <Link to="/student" className="mt-4 inline-block text-primary">
          ← Back to dashboard
        </Link>
      </Card>
    );
  }

  if (!question) {
    return null;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Link
        to="/student"
        className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <Card>
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle>{quiz.title}</CardTitle>
            <p className="text-sm text-muted">
              Question {activeIndex + 1} of {quiz.questions.length}
              {quiz.topic ? ` · ${quiz.topic}` : ''}
            </p>
          </div>
          <span className="text-sm font-medium text-primary">{question.points} XP</span>
        </div>

        <p className="mt-6 text-lg font-medium text-ink">{question.questionText}</p>

        {alreadyAnswered && !feedback && (
          <p className="mt-3 text-sm text-muted">
            Your previous answer is highlighted below. Tap another option to change it.
          </p>
        )}

        <div className="mt-4 space-y-2">
          {question.options.map((opt, idx) => {
            const isSelected = selected === idx;
            const showCorrect = displayFeedback && idx === displayFeedback.correctOptionIndex;
            const showWrong = displayFeedback && isSelected && !displayFeedback.isCorrect;

            return (
              <button
                key={idx}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSelect(idx)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  showCorrect
                    ? 'border-success bg-success/10'
                    : showWrong
                      ? 'border-danger bg-danger/10'
                      : isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-gray-200 hover:border-primary/40'
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-muted'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="min-w-0 flex-1">{opt}</span>
                {isSelected && (
                  <span className="shrink-0 text-xs font-medium text-primary">Your answer</span>
                )}
              </button>
            );
          })}
        </div>

        {submitError && (
          <p className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{submitError}</p>
        )}

        {displayFeedback && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl p-3 text-sm ${
              displayFeedback.isCorrect ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
            }`}
          >
            {displayFeedback.isCorrect ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div>
              <p className="font-medium">
                {displayFeedback.isCorrect
                  ? priorFeedback && !feedback
                    ? 'Correct — your previous answer'
                    : 'Correct!'
                  : priorFeedback && !feedback
                    ? 'Incorrect — your previous answer'
                    : 'Not quite — try to remember for next time.'}
              </p>
              {displayFeedback.explanation && (
                <p className="mt-1 opacity-90">{displayFeedback.explanation}</p>
              )}
              <p className="mt-1">+{displayFeedback.pointsEarned} XP</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          {activeIndex > 0 ? (
            <Button type="button" variant="outline" onClick={goPrevious}>
              Previous question
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={goNext} disabled={selected === null}>
            {activeIndex < quiz.questions.length - 1 ? 'Next question' : 'Finish quiz'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
