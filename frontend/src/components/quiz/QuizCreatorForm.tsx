import { useState } from 'react';
import { Sparkles, Upload } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuestionSkeletonGrid } from '@/components/ui/Skeleton';
import { createQuiz } from '@/api/quiz.api';
import { createManualQuestion, enqueueAiGeneration } from '@/api/questions.api';
import { logApiError } from '@/api/client';
import { useAiGenerationPoll } from '@/hooks/useAiGenerationPoll';
import { useNotificationStore } from '@/store/notificationStore';
import type { CreateQuizPayload } from '@/types/quiz';

const DEFAULT_CLASS_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

interface QuizCreatorFormProps {
  defaultClassId?: string;
}

export function QuizCreatorForm({ defaultClassId = DEFAULT_CLASS_ID }: QuizCreatorFormProps) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Science');
  const [topic, setTopic] = useState('');
  const [manualText, setManualText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  const { isPolling, progress, status, error, startPolling, reset } = useAiGenerationPoll({
    onCompleted: (task) => {
      addNotification({
        title: 'AI questions ready',
        body: `${task.completedCount} questions added to your quiz.`,
        type: 'success',
      });
    },
    onFailed: () => {
      addNotification({
        title: 'AI generation failed',
        body: 'Please refine your prompt and try again.',
        type: 'error',
      });
    },
  });

  const ensureQuiz = async (): Promise<string> => {
    if (quizId) return quizId;
    const payload: CreateQuizPayload = {
      classId: defaultClassId,
      title: title || 'Untitled Quiz',
      subject,
      topic: topic || undefined,
    };
    const quiz = await createQuiz(payload);
    setQuizId(quiz.id);
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

  const handleManualAdd = async () => {
    if (!manualText.trim()) return;
    setIsSaving(true);
    try {
      const id = await ensureQuiz();
      await createManualQuestion(id, {
        questionText: manualText,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctOptionIndex: 0,
        explanation: 'Teacher-verified answer.',
      });
      setManualText('');
      addNotification({ title: 'Question added', body: 'Manual MCQ saved.', type: 'success' });
    } catch (err) {
      logApiError('Manual question failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsSaving(true);
    reset();
    try {
      const id = await ensureQuiz();
      const accepted = await enqueueAiGeneration(id, {
        prompt: aiPrompt,
        count: aiCount,
        subject,
        topic: topic || undefined,
      });
      startPolling(accepted.taskId);
      addNotification({
        title: 'AI generation queued',
        body: 'Building questions in the background…',
        type: 'info',
      });
    } catch (err) {
      logApiError('AI enqueue failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardTitle>Quiz details</CardTitle>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Quiz title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
            <input
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
              placeholder="Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateQuiz} disabled={isSaving}>
            Save draft quiz
          </Button>
          {quizId && (
            <p className="text-xs text-muted">Quiz ID: {quizId}</p>
          )}
        </div>
      </Card>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-4 w-4" /> Manual entry
        </CardTitle>
        <textarea
          className="mt-3 min-h-[100px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Type a question stem…"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
        />
        <Button variant="outline" className="mt-3" onClick={handleManualAdd} disabled={isSaving}>
          Add manual MCQ
        </Button>
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-surface p-6 text-center text-sm text-muted">
          Bulk CSV / Excel upload — coming soon
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> AI prompt ingestion
        </CardTitle>
        <p className="mt-1 text-sm text-muted">
          Connects to{' '}
          <code className="rounded bg-gray-100 px-1 text-xs">
            POST /api/quizzes/:quizId/questions/ai-generate
          </code>{' '}
          with async polling.
        </p>
        <textarea
          className="mt-3 min-h-[120px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Generate 10 MCQs on photosynthesis for grade 8…"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted">
            Count
            <input
              type="number"
              min={1}
              max={50}
              className="ml-2 w-16 rounded-lg border border-gray-200 px-2 py-1"
              value={aiCount}
              onChange={(e) => setAiCount(Number(e.target.value))}
            />
          </label>
          <Button onClick={handleAiGenerate} disabled={isSaving || isPolling}>
            Generate with AI
          </Button>
        </div>

        {isPolling && (
          <div className="mt-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-primary">Generating questions…</span>
              <span className="text-muted">{status} · {progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <QuestionSkeletonGrid count={3} />
          </div>
        )}

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Card>
    </div>
  );
}
