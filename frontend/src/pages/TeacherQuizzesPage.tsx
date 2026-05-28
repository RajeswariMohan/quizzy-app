import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Pencil,
  RefreshCw,
  Sparkles,
  EyeOff,
  Send,
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QuizCreatorForm } from '@/components/quiz/QuizCreatorForm';
import { PublishQuizDialog } from '@/components/quiz/PublishQuizDialog';
import { QuizEditForm } from '@/components/quiz/QuizEditForm';
import { listQuizzes, publishQuiz, unpublishQuiz } from '@/api/quiz.api';
import { listQuestions } from '@/api/questions.api';
import { QuestionListItem } from '@/components/quiz/QuestionListItem';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useSchoolFilterStore } from '@/store/schoolFilterStore';
import { PageWithScrollBelowFilter } from '@/components/layout/PageWithScrollBelowFilter';
import { QuizListFilterBar } from '@/components/quiz/QuizListFilterBar';
import { formatAudienceLabel } from '@/utils/quizAudience';
import { formatQuizSubtitle } from '@/utils/quizMeta';
import {
  applyQuizListFilters,
  buildQuizFilterOptions,
  DEFAULT_QUIZ_LIST_FILTERS,
  filterQuizzesByStatus,
  type QuizListFilters,
} from '@/utils/quizFilters';
import type { PublishQuizPayload, QuestionItem, QuizStatus, QuizSummary } from '@/types/quiz';

type StatusFilter = 'ALL' | QuizStatus;

function statusBadgeClass(status: QuizStatus): string {
  if (status === 'PUBLISHED') return 'bg-success/15 text-success';
  if (status === 'ARCHIVED') return 'bg-gray-200 text-muted';
  return 'bg-warning/15 text-warning';
}

export function TeacherQuizzesPage() {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const filterVersion = useSchoolFilterStore((s) => s.filterVersion);
  const filterLabel = useSchoolFilterStore((s) => s.getFilterLabel());
  const isSuperAdmin = useAuthStore((s) => s.user?.role === 'SUPER_ADMIN');
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const [listFilters, setListFilters] = useState<QuizListFilters>(DEFAULT_QUIZ_LIST_FILTERS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishDialogQuiz, setPublishDialogQuiz] = useState<QuizSummary | null>(null);
  const [unpublishingId, setUnpublishingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingQuestionsId, setAddingQuestionsId] = useState<string | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const loadQuizzes = useCallback(() => {
    setIsLoading(true);
    setError(null);
    listQuizzes()
      .then(setQuizzes)
      .catch((err) => {
        logApiError('Load quizzes failed', err);
        setError(getApiErrorMessage(err, 'Could not load quizzes.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes, filterVersion]);

  const filterOptions = useMemo(() => buildQuizFilterOptions(quizzes), [quizzes]);

  const byStatus = useMemo(
    () => filterQuizzesByStatus(quizzes, filter),
    [quizzes, filter],
  );

  const filtered = useMemo(
    () => applyQuizListFilters(byStatus, listFilters),
    [byStatus, listFilters],
  );

  const counts = useMemo(
    () => ({
      all: quizzes.length,
      draft: quizzes.filter((q) => q.status === 'DRAFT').length,
      published: quizzes.filter((q) => q.status === 'PUBLISHED').length,
      archived: quizzes.filter((q) => q.status === 'ARCHIVED').length,
    }),
    [quizzes],
  );

  const statusTabs = useMemo(() => {
    const tabs: [StatusFilter, string][] = [
      ['ALL', `All (${counts.all})`],
      ['DRAFT', `Draft (${counts.draft})`],
      ['PUBLISHED', `Published (${counts.published})`],
    ];
    if (counts.archived > 0) {
      tabs.push(['ARCHIVED', `Archived (${counts.archived})`]);
    }
    return tabs;
  }, [counts]);

  const handleUnpublish = async (quizId: string) => {
    setUnpublishingId(quizId);
    try {
      await unpublishQuiz(quizId);
      addNotification({
        title: 'Quiz unpublished',
        body: 'Students can no longer see this quiz. Edit and publish again when ready.',
        type: 'info',
      });
      setEditingId(null);
      setAddingQuestionsId(null);
      loadQuizzes();
    } catch (err) {
      logApiError('Unpublish failed', err);
      addNotification({
        title: 'Unpublish failed',
        body: getApiErrorMessage(err, 'Could not unpublish quiz.'),
        type: 'error',
      });
    } finally {
      setUnpublishingId(null);
    }
  };

  const confirmPublish = async (quizId: string, payload: PublishQuizPayload) => {
    try {
      const result = await publishQuiz(quizId, payload);
      const audience =
        payload.audienceScope === 'SCHOOL'
          ? 'all students in your school'
          : formatAudienceLabel(payload.audienceScope, payload.targets);
      addNotification({
        title: 'Quiz published',
        body: `${result.questionCount} questions are live for ${audience}.`,
        type: 'success',
      });
      setAddingQuestionsId(null);
      setPublishDialogQuiz(null);
      loadQuizzes();
    } catch (err) {
      logApiError('Publish failed', err);
      addNotification({
        title: 'Publish failed',
        body: getApiErrorMessage(err, 'Add questions before publishing.'),
        type: 'error',
      });
      throw err;
    }
  };

  const refreshQuestions = async (quizId: string) => {
    const qs = await listQuestions(quizId);
    setQuestions(qs);
  };

  const toggleQuestions = async (quizId: string) => {
    if (expandedId === quizId) {
      setExpandedId(null);
      setQuestions([]);
      setEditingQuestionId(null);
      return;
    }
    setExpandedId(quizId);
    setEditingQuestionId(null);
    setLoadingQuestions(true);
    try {
      const qs = await listQuestions(quizId);
      setQuestions(qs);
    } catch (err) {
      logApiError('Load questions failed', err);
      setQuestions([]);
      addNotification({
        title: 'Could not load questions',
        body: getApiErrorMessage(err, 'Try again.'),
        type: 'error',
      });
    } finally {
      setLoadingQuestions(false);
    }
  };

  return (
    <>
      <PageWithScrollBelowFilter
        header={
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-ink">Quizzes</h1>
              <p className="text-muted">
                {isSuperAdmin
                  ? `Manage quizzes · ${filterLabel}`
                  : 'Create, edit, unpublish, and republish quizzes with manual and AI questions'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={loadQuizzes} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
        filter={
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" />
                Your quizzes
              </CardTitle>
              <div className="flex flex-wrap gap-2">
                {statusTabs.map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFilter(key)}
                    className={`rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                      filter === key
                        ? 'bg-primary text-white'
                        : 'bg-white text-muted hover:text-ink ring-1 ring-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {!isLoading && !error && quizzes.length > 0 && (
              <QuizListFilterBar
                filters={listFilters}
                options={filterOptions}
                resultCount={filtered.length}
                totalCount={byStatus.length}
                onChange={setListFilters}
              />
            )}
          </div>
        }
      >
        <Card className="border-primary/20 bg-primary/5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          Create new quiz
        </CardTitle>
        <p className="mt-1 text-sm text-muted">
          Manual MCQs, AI generation (async), then publish for your class.
        </p>
        <div className="mt-4">
          <QuizCreatorForm
            onPublished={loadQuizzes}
            onQuestionAdded={async (quizId) => {
              loadQuizzes();
              setExpandedId(quizId);
              setEditingQuestionId(null);
              setLoadingQuestions(true);
              try {
                await refreshQuestions(quizId);
              } finally {
                setLoadingQuestions(false);
              }
            }}
          />
        </div>
      </Card>

        <Card>
        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <p className="mt-6 text-center text-sm text-muted">
            {quizzes.length === 0
              ? 'No quizzes yet. Create one above to get started.'
              : byStatus.length === 0
                ? 'No quizzes in this status tab.'
                : 'No quizzes match your filters. Try clearing filters or changing the search.'}
          </p>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className="mt-4 space-y-3">
            {filtered.map((quiz) => (
              <div
                key={quiz.id}
                className="rounded-xl border border-gray-100 bg-white overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-ink">{quiz.title}</p>
                      <Badge className={statusBadgeClass(quiz.status)}>{quiz.status}</Badge>
                    </div>
                    <p className="text-xs text-muted">{formatQuizSubtitle(quiz)}</p>
                    {quiz.status === 'PUBLISHED' && quiz.audienceScope && (
                      <p className="text-xs text-muted">
                        Audience: {formatAudienceLabel(quiz.audienceScope, quiz.audienceTargets)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(editingId === quiz.id ? null : quiz.id);
                        setAddingQuestionsId(null);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleQuestions(quiz.id)}
                    >
                      {expandedId === quiz.id ? (
                        <>
                          <ChevronUp className="h-4 w-4" /> Hide
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" /> Questions
                        </>
                      )}
                    </Button>
                    {quiz.status === 'DRAFT' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAddingQuestionsId(
                              addingQuestionsId === quiz.id ? null : quiz.id,
                            );
                            setEditingId(null);
                          }}
                        >
                          Add questions
                        </Button>
                        <Button
                          size="sm"
                          disabled={(quiz.questionCount ?? 0) === 0}
                          onClick={() => setPublishDialogQuiz(quiz)}
                        >
                          <Send className="h-4 w-4" />
                          Publish
                        </Button>
                      </>
                    )}
                    {quiz.status === 'PUBLISHED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={unpublishingId === quiz.id}
                        onClick={() => handleUnpublish(quiz.id)}
                      >
                        <EyeOff className="h-4 w-4" />
                        {unpublishingId === quiz.id ? 'Unpublishing…' : 'Unpublish'}
                      </Button>
                    )}
                  </div>
                </div>

                {editingId === quiz.id && (
                  <QuizEditForm
                    quiz={quiz}
                    onSaved={() => {
                      setEditingId(null);
                      loadQuizzes();
                      addNotification({
                        title: 'Quiz updated',
                        body: 'Your changes were saved.',
                        type: 'success',
                      });
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                )}

                {addingQuestionsId === quiz.id && quiz.status === 'DRAFT' && (
                  <div className="border-t border-gray-100 bg-primary/5 px-4 py-4">
                    <QuizCreatorForm
                      compact
                      existingQuizId={quiz.id}
                      onCancel={() => setAddingQuestionsId(null)}
                      onQuestionAdded={async (quizId) => {
                        loadQuizzes();
                        if (expandedId === quizId) {
                          setLoadingQuestions(true);
                          try {
                            await refreshQuestions(quizId);
                          } finally {
                            setLoadingQuestions(false);
                          }
                        }
                      }}
                      onPublished={() => {
                        setAddingQuestionsId(null);
                        loadQuizzes();
                      }}
                    />
                  </div>
                )}

                {expandedId === quiz.id && (
                  <div className="border-t border-gray-100 bg-surface px-4 py-3">
                    {loadingQuestions ? (
                      <p className="text-sm text-muted">Loading questions…</p>
                    ) : questions.length === 0 ? (
                      <p className="text-sm text-muted">No questions yet.</p>
                    ) : (
                      <>
                        {quiz.status !== 'DRAFT' && (
                          <p className="mb-3 text-xs text-muted">
                            Unpublish this quiz to edit questions and choices.
                          </p>
                        )}
                        <ol className="space-y-3 text-sm">
                          {questions.map((q, i) => (
                            <QuestionListItem
                              key={q.id}
                              question={q}
                              index={i}
                              quizId={quiz.id}
                              canEdit={quiz.status === 'DRAFT'}
                              isEditing={editingQuestionId === q.id}
                              onStartEdit={() => setEditingQuestionId(q.id)}
                              onCancelEdit={() => setEditingQuestionId(null)}
                              onSaved={() => {
                                setEditingQuestionId(null);
                                refreshQuestions(quiz.id).catch(() => undefined);
                                loadQuizzes();
                              }}
                              onDeleted={() => {
                                setEditingQuestionId(null);
                                refreshQuestions(quiz.id).catch(() => undefined);
                                loadQuizzes();
                              }}
                            />
                          ))}
                        </ol>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        </Card>
      </PageWithScrollBelowFilter>

      {publishDialogQuiz && (
        <PublishQuizDialog
          quiz={publishDialogQuiz}
          onClose={() => setPublishDialogQuiz(null)}
          onConfirm={(payload) => confirmPublish(publishDialogQuiz.id, payload)}
        />
      )}
    </>
  );
}
