import { useCallback, useEffect, useState } from 'react';
import { listQuestions } from '@/api/questions.api';
import { logApiError } from '@/api/client';
import { QuestionListItem } from '@/components/quiz/QuestionListItem';
import type { QuestionItem, QuizStatus } from '@/types/quiz';

interface QuizQuestionsPanelProps {
  quizId: string;
  quizStatus?: QuizStatus;
  refreshKey?: number;
}

export function QuizQuestionsPanel({
  quizId,
  quizStatus = 'DRAFT',
  refreshKey = 0,
}: QuizQuestionsPanelProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    listQuestions(quizId)
      .then(setQuestions)
      .catch((err) => {
        logApiError('Load questions failed', err);
        setQuestions([]);
      })
      .finally(() => setLoading(false));
  }, [quizId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const canEdit = quizStatus === 'DRAFT';

  if (loading) {
    return <p className="text-sm text-muted">Loading saved questions…</p>;
  }

  if (questions.length === 0) {
    return (
      <p className="text-sm text-muted">
        No questions saved yet. Add manually, import CSV, or use AI above.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {questions.map((q, i) => (
        <QuestionListItem
          key={q.id}
          question={q}
          index={i}
          quizId={quizId}
          canEdit={canEdit}
          isEditing={editingQuestionId === q.id}
          onStartEdit={() => setEditingQuestionId(q.id)}
          onCancelEdit={() => setEditingQuestionId(null)}
          onSaved={() => {
            setEditingQuestionId(null);
            load();
          }}
          onDeleted={() => {
            setEditingQuestionId(null);
            load();
          }}
        />
      ))}
    </ol>
  );
}
