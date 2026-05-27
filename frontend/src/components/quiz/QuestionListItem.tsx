import { useMemo, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ManualMcqForm } from '@/components/quiz/ManualMcqForm';
import { deleteQuestion, updateQuestion } from '@/api/questions.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { useNotificationStore } from '@/store/notificationStore';
import type { ManualQuestionPayload, QuestionItem } from '@/types/quiz';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

function toPayload(question: QuestionItem): ManualQuestionPayload {
  const opts = question.options;
  return {
    questionText: question.questionText,
    options: [
      opts[0] ?? '',
      opts[1] ?? '',
      opts[2] ?? '',
      opts[3] ?? '',
    ],
    correctOptionIndex: question.correctOptionIndex,
    explanation: question.explanation ?? undefined,
  };
}

interface QuestionListItemProps {
  question: QuestionItem;
  index: number;
  quizId: string;
  canEdit: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDeleted: () => void;
}

export function QuestionListItem({
  question,
  index,
  quizId,
  canEdit,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onSaved,
  onDeleted,
}: QuestionListItemProps) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [isDeleting, setIsDeleting] = useState(false);
  const initialPayload = useMemo(
    () => toPayload(question),
    [
      question.id,
      question.questionText,
      question.correctOptionIndex,
      question.explanation,
      question.options[0],
      question.options[1],
      question.options[2],
      question.options[3],
    ],
  );

  if (isEditing) {
    return (
      <li className="rounded-xl border border-primary/30 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-ink">Edit question {index + 1}</p>
        <ManualMcqForm
          formId={question.id}
          initial={initialPayload}
          submitLabel="Save changes"
          onCancel={onCancelEdit}
          onSubmit={async (payload) => {
            try {
              await updateQuestion(quizId, question.id, payload);
              addNotification({
                title: 'Question updated',
                body: 'Your changes were saved.',
                type: 'success',
              });
              onSaved();
            } catch (err) {
              logApiError('Update question failed', err);
              addNotification({
                title: 'Update failed',
                body: getApiErrorMessage(err, 'Could not save question.'),
                type: 'error',
              });
              throw err;
            }
          }}
        />
      </li>
    );
  }

  return (
    <li className="rounded-lg bg-white px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">
            <span className="text-muted">Q{index + 1}.</span> {question.questionText}
          </p>
          <ul className="mt-2 space-y-1 text-sm text-ink">
            {OPTION_LABELS.map((label, idx) => {
              const isCorrect = question.correctOptionIndex === idx;
              const text = question.options[idx];
              if (!text) return null;
              return (
                <li
                  key={label}
                  className={`rounded-lg px-2 py-1 ${
                    isCorrect ? 'bg-success/10 font-medium text-success' : 'text-muted'
                  }`}
                >
                  <span className="font-semibold">{label}.</span> {text}
                  {isCorrect && (
                    <span className="ml-1 text-xs">(correct)</span>
                  )}
                </li>
              );
            })}
          </ul>
          {question.explanation && (
            <p className="mt-2 text-xs text-muted">
              Explanation: {question.explanation}
            </p>
          )}
        </div>
        {canEdit && (
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={onStartEdit} disabled={isDeleting}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              className="text-danger hover:border-danger/40 hover:bg-danger/5"
              onClick={async () => {
                const confirmed = window.confirm(
                  `Delete question ${index + 1}? This cannot be undone.`,
                );
                if (!confirmed) return;
                setIsDeleting(true);
                try {
                  await deleteQuestion(quizId, question.id);
                  addNotification({
                    title: 'Question deleted',
                    body: 'The question was removed from this quiz.',
                    type: 'success',
                  });
                  onDeleted();
                } catch (err) {
                  logApiError('Delete question failed', err);
                  addNotification({
                    title: 'Delete failed',
                    body: getApiErrorMessage(
                      err,
                      'Unpublish the quiz first, then delete the question.',
                    ),
                    type: 'error',
                  });
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-muted">
        {question.sourceType === 'AI_GENERATED' ? 'AI' : 'Manual'} · {question.points} pts
      </p>
    </li>
  );
}
