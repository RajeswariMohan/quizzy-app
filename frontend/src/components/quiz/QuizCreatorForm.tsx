import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Upload, UserCircle } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createQuiz, getQuiz, publishQuiz } from '@/api/quiz.api';
import { PublishQuizDialog } from '@/components/quiz/PublishQuizDialog';
import { createManualQuestion } from '@/api/questions.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { BulkQuestionUpload } from '@/components/quiz/BulkQuestionUpload';
import { ManualMcqForm } from '@/components/quiz/ManualMcqForm';
import { useNotificationStore } from '@/store/notificationStore';
import { QuizQuestionsPanel } from '@/components/quiz/QuizQuestionsPanel';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { BOARDS } from '@/constants/academics';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { useAuthStore } from '@/store/authStore';
import { formatUserRole } from '@/utils/userRole';
import { formatAudienceLabel } from '@/utils/quizAudience';
import type { CreateQuizPayload, PublishQuizPayload, QuizCreator, QuizStatus } from '@/types/quiz';

interface QuizCreatorFormProps {
  /** @deprecated Grade on the quiz resolves the class automatically */
  defaultClassId?: string;
  /** Load an existing draft quiz to add more questions */
  existingQuizId?: string | null;
  onPublished?: () => void;
  onQuestionAdded?: (quizId: string) => void;
  /** When set, Cancel on manual MCQ closes this flow (e.g. hide “Add questions” panel) */
  onCancel?: () => void;
  compact?: boolean;
}

export function QuizCreatorForm({
  existingQuizId = null,
  onPublished,
  onQuestionAdded,
  onCancel,
  compact = false,
}: QuizCreatorFormProps) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const currentUser = useAuthStore((s) => s.user);
  const { grades: schoolGrades, subjects: schoolSubjects } = useSchoolAcademics();
  const [savedCreator, setSavedCreator] = useState<QuizCreator | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [quizClassSection, setQuizClassSection] = useState<string | null>(null);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [board, setBoard] = useState<string>(BOARDS[0]);
  const [grade, setGrade] = useState<string>(schoolGrades[0] ?? '');
  const [subject, setSubject] = useState<string>(schoolSubjects[0] ?? '');
  const gradeOptions = useMemo(() => {
    const list = [...schoolGrades];
    if (grade && !list.includes(grade)) list.unshift(grade);
    return list;
  }, [schoolGrades, grade]);
  const subjectOptions = useMemo(() => {
    const list = [...schoolSubjects];
    if (subject && !list.includes(subject)) list.unshift(subject);
    return list;
  }, [schoolSubjects, subject]);
  const [topic, setTopic] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [quizStatus, setQuizStatus] = useState<QuizStatus>('DRAFT');
  const [questionsRefreshKey, setQuestionsRefreshKey] = useState(0);

  const refreshSavedQuestions = (id: string) => {
    setQuestionsRefreshKey((k) => k + 1);
    onQuestionAdded?.(id);
  };

  useEffect(() => {
    if (schoolGrades.length > 0 && !schoolGrades.includes(grade)) {
      setGrade(schoolGrades[0]);
    }
  }, [schoolGrades, grade]);

  useEffect(() => {
    if (schoolSubjects.length > 0 && !schoolSubjects.includes(subject)) {
      setSubject(schoolSubjects[0]);
    }
  }, [schoolSubjects, subject]);

  useEffect(() => {
    if (!existingQuizId) return;
    setQuizId(existingQuizId);
    getQuiz(existingQuizId)
      .then((q) => {
        setTitle(q.title);
        setBoard(q.board ?? BOARDS[0]);
        setGrade(q.grade ?? schoolGrades[0] ?? '');
        setSubject(q.subject ?? schoolSubjects[0] ?? '');
        setTopic(q.topic ?? '');
        setQuizStatus(q.status);
        setQuizClassSection(q.classSection ?? null);
        setSavedCreator(q.createdBy ?? null);
        setQuestionsRefreshKey((k) => k + 1);
      })
      .catch((err) => logApiError('Load quiz for editing failed', err));
  }, [existingQuizId]);

  const ensureQuiz = async (): Promise<string> => {
    if (quizId) return quizId;
    const payload: CreateQuizPayload = {
      title: title || 'Untitled Quiz',
      board,
      grade,
      subject,
      topic: topic || undefined,
    };
    const quiz = await createQuiz(payload);
    setQuizId(quiz.id);
    setQuizStatus(quiz.status);
    if (quiz.createdBy) setSavedCreator(quiz.createdBy);
    setQuestionsRefreshKey((k) => k + 1);
    return quiz.id;
  };

  const handleCreateQuiz = async () => {
    setIsSaving(true);
    try {
      await ensureQuiz();
      addNotification({ title: 'Quiz saved', body: 'Draft quiz created.', type: 'success' });
    } catch (err) {
      logApiError('Create quiz failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async (payload: Parameters<typeof createManualQuestion>[1]) => {
    const id = await ensureQuiz();
    await createManualQuestion(id, payload);
    addNotification({ title: 'Question saved', body: 'MCQ added to this quiz.', type: 'success' });
    refreshSavedQuestions(id);
  };

  const handlePublishConfirm = async (payload: PublishQuizPayload) => {
    setIsSaving(true);
    try {
      const id = await ensureQuiz();
      const result = await publishQuiz(id, payload);
      const audience =
        payload.audienceScope === 'SCHOOL'
          ? 'all students in your school'
          : formatAudienceLabel(payload.audienceScope, payload.targets);
      addNotification({
        title: 'Quiz published',
        body: `${result.questionCount} questions are now visible to ${audience}.`,
        type: 'success',
      });
      onPublished?.();
    } catch (err) {
      logApiError('Publish quiz failed', err);
      addNotification({
        title: 'Publish failed',
        body: getApiErrorMessage(err, 'Add at least one question before publishing.'),
        type: 'error',
      });
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const showQuizMeta = !compact || !existingQuizId;

  const creatorDisplay = savedCreator
    ? `${savedCreator.displayName} (${formatUserRole(savedCreator.role)})`
    : currentUser
      ? `${currentUser.displayName} (${formatUserRole(currentUser.role)})`
      : null;

  return (
    <div className={compact ? 'space-y-4' : 'flex flex-col gap-6'}>
      {showQuizMeta && (
        <Card className={compact ? '!p-4' : undefined}>
          <CardTitle>{existingQuizId ? 'Quiz details' : 'New quiz'}</CardTitle>
          {creatorDisplay && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-primary/15 bg-white/80 px-3 py-2.5 text-sm">
              <UserCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-ink">Created by</p>
                <p className="text-muted">{creatorDisplay}</p>
                {savedCreator?.email && (
                  <p className="text-xs text-muted">{savedCreator.email}</p>
                )}
                {!savedCreator && currentUser?.email && (
                  <p className="text-xs text-muted">{currentUser.email}</p>
                )}
              </div>
            </div>
          )}
          <div className="mt-4 space-y-3">
            <input
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              placeholder="Quiz title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              readOnly={Boolean(existingQuizId)}
            />
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect
                label="Board"
                value={board}
                options={BOARDS}
                onChange={setBoard}
                disabled={Boolean(existingQuizId)}
              />
              <FieldSelect
                label="Grade"
                value={grade}
                options={gradeOptions}
                onChange={setGrade}
                disabled={Boolean(existingQuizId)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FieldSelect
                label="Subject"
                value={subject}
                options={subjectOptions}
                onChange={setSubject}
                disabled={Boolean(existingQuizId)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Topic</label>
                <input
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="e.g. Photosynthesis"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  readOnly={Boolean(existingQuizId)}
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              Quiz details are auto-used when you add the first question.
            </p>
            {compact && existingQuizId && title && (
              <p className="text-xs text-muted">
                Adding questions to <span className="font-medium text-ink">{title}</span>
              </p>
            )}
          </div>
        </Card>
      )}

      <Card className={compact && existingQuizId ? '!p-4' : undefined}>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" /> Manual MCQ
        </CardTitle>
        <p className="mt-1 text-sm text-muted">
          Enter the question, four options, and mark the correct answer.
        </p>
        <div className="mt-4">
          <ManualMcqForm
            disabled={isSaving}
            submitLabel="Add question"
            extraActions={
              <>
                {!existingQuizId && (
                  <Button type="button" variant="outline" onClick={handleCreateQuiz} disabled={isSaving}>
                    Save draft quiz
                  </Button>
                )}
                {!compact && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPublishDialog(true)}
                    disabled={isSaving || !quizId}
                  >
                    Publish quiz
                  </Button>
                )}
              </>
            }
            onSubmit={handleManualSave}
            onCancel={onCancel}
          />
        </div>
        <BulkQuestionUpload
          disabled={isSaving}
          ensureQuiz={ensureQuiz}
          onImported={(count, id) => {
            setQuizId(id);
            addNotification({
              title: 'Questions imported',
              body: `${count} MCQs added. Review and edit below.`,
              type: 'success',
            });
            refreshSavedQuestions(id);
          }}
        />
      </Card>

      {quizId && (
        <Card className={compact ? '!p-4' : undefined}>
          <CardTitle>Saved questions — review &amp; edit</CardTitle>
          <p className="mt-1 text-sm text-muted">
            Imported and manual questions appear here. Click Edit to change text or options.
          </p>
          <div className="mt-4">
            <QuizQuestionsPanel
              quizId={quizId}
              quizStatus={quizStatus}
              refreshKey={questionsRefreshKey}
            />
          </div>
        </Card>
      )}

      <Card
        className={`border-gray-200 bg-gray-50/90 opacity-75 ${compact ? '!p-4' : ''}`}
        aria-disabled="true"
      >
        <CardTitle className="flex items-center gap-2 text-muted">
          <Sparkles className="h-4 w-4" /> AI prompt ingestion
        </CardTitle>
        <p className="mt-1 text-sm text-muted">
          Temporarily unavailable — use manual MCQs or bulk upload above.
        </p>
        <fieldset disabled className="mt-3 min-w-0 border-0 p-0">
          <textarea
            readOnly
            tabIndex={-1}
            className="min-h-[120px] w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100/80 px-3 py-2 text-sm text-muted"
            placeholder={`Generate MCQs on ${topic || 'this topic'} for ${grade}…`}
            defaultValue=""
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-muted">
              Count
              <input
                type="number"
                min={1}
                max={50}
                readOnly
                tabIndex={-1}
                className="ml-2 w-16 cursor-not-allowed rounded-lg border border-gray-200 bg-gray-100/80 px-2 py-1 text-muted"
                defaultValue={5}
              />
            </label>
            <Button type="button" disabled>
              Generate with AI
            </Button>
          </div>
        </fieldset>
      </Card>

      {showPublishDialog && quizId && (
        <PublishQuizDialog
          quiz={{ id: quizId, title: title || 'Untitled Quiz', grade, classSection: quizClassSection }}
          onClose={() => setShowPublishDialog(false)}
          onConfirm={handlePublishConfirm}
        />
      )}
    </div>
  );
}
