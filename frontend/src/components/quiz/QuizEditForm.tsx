import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { useMemo } from 'react';
import { BOARDS } from '@/constants/academics';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { getQuiz, updateQuiz } from '@/api/quiz.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import type { QuizSummary } from '@/types/quiz';

interface QuizEditFormProps {
  quiz: QuizSummary;
  onSaved: () => void;
  onCancel: () => void;
}

export function QuizEditForm({ quiz, onSaved, onCancel }: QuizEditFormProps) {
  const { grades: schoolGrades, subjects: schoolSubjects } = useSchoolAcademics();
  const [title, setTitle] = useState(quiz.title);
  const [board, setBoard] = useState(quiz.board ?? BOARDS[0]);
  const [grade, setGrade] = useState(quiz.grade ?? schoolGrades[0] ?? '');
  const [subject, setSubject] = useState(quiz.subject ?? schoolSubjects[0] ?? '');
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
  const [topic, setTopic] = useState(quiz.topic ?? '');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getQuiz(quiz.id)
      .then((full) => {
        setDescription(full.description ?? '');
        setBoard(full.board ?? BOARDS[0]);
        setGrade(full.grade ?? schoolGrades[0] ?? '');
        setSubject(full.subject ?? schoolSubjects[0] ?? '');
        setTopic(full.topic ?? '');
      })
      .catch(() => undefined);
  }, [quiz.id]);

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await updateQuiz(quiz.id, {
        title: title.trim(),
        board,
        grade,
        subject: subject.trim() || undefined,
        topic: topic.trim() || undefined,
        description: description.trim() || undefined,
      });
      onSaved();
    } catch (err) {
      logApiError('Update quiz failed', err);
      setError(getApiErrorMessage(err, 'Could not save changes.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-3 border-t border-gray-100 bg-surface px-4 py-4">
      <p className="text-sm font-medium text-ink">Edit quiz details</p>
      {quiz.status === 'PUBLISHED' && (
        <p className="text-xs text-warning">
          Unpublish first to add or remove questions. You can still update title and metadata.
        </p>
      )}
      <input
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        placeholder="Quiz title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <FieldSelect label="Board" value={board} options={BOARDS} onChange={setBoard} />
        <FieldSelect label="Grade" value={grade} options={gradeOptions} onChange={setGrade} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FieldSelect label="Subject" value={subject} options={subjectOptions} onChange={setSubject} />
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Topic</label>
          <input
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
      </div>
      <textarea
        className="min-h-[72px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
