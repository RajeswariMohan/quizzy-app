import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import type { PublishQuizPayload, QuizAudienceScope, QuizSummary } from '@/types/quiz';
import { buildDefaultPublishTargets, targetKey } from '@/utils/quizAudience';

interface PublishQuizDialogProps {
  quiz: Pick<QuizSummary, 'id' | 'title' | 'grade' | 'classSection'>;
  onClose: () => void;
  onConfirm: (payload: PublishQuizPayload) => Promise<void>;
}

export function PublishQuizDialog({ quiz, onClose, onConfirm }: PublishQuizDialogProps) {
  const { grades, sections, isLoading } = useSchoolAcademics();
  const defaultTargets = useMemo(
    () => buildDefaultPublishTargets(quiz, grades, sections),
    [quiz, grades, sections],
  );

  const [scope, setScope] = useState<QuizAudienceScope>(
    defaultTargets.length > 0 ? 'GRADE_SECTION' : 'SCHOOL',
  );
  const [selected, setSelected] = useState<Set<string>>(() =>
    new Set(defaultTargets.map((t) => targetKey(t.grade, t.section))),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const combinations = useMemo(
    () =>
      grades.flatMap((grade) =>
        sections.map((section) => ({ grade, section })),
      ),
    [grades, sections],
  );

  const toggleTarget = (grade: string, section: string) => {
    const key = targetKey(grade, section);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (scope === 'GRADE_SECTION' && selected.size === 0) {
      setError('Select at least one grade and section.');
      return;
    }

    const payload: PublishQuizPayload =
      scope === 'SCHOOL'
        ? { audienceScope: 'SCHOOL' }
        : {
            audienceScope: 'GRADE_SECTION',
            targets: Array.from(selected).map((key) => {
              const [grade, section] = key.split('::');
              return { grade, section };
            }),
          };

    setIsPublishing(true);
    try {
      await onConfirm(payload);
      onClose();
    } catch {
      setError('Could not publish quiz. Try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-quiz-title"
    >
      <Card className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-muted hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <CardTitle id="publish-quiz-title" className="pr-10">
          Publish quiz
        </CardTitle>
        <p className="mt-1 text-sm text-muted">{quiz.title}</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">Who can take this quiz?</legend>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-100 px-3 py-2.5">
              <input
                type="radio"
                name="audienceScope"
                value="SCHOOL"
                checked={scope === 'SCHOOL'}
                onChange={() => setScope('SCHOOL')}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-ink">All students</span>
                <span className="text-xs text-muted">Every student in your school</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-100 px-3 py-2.5">
              <input
                type="radio"
                name="audienceScope"
                value="GRADE_SECTION"
                checked={scope === 'GRADE_SECTION'}
                onChange={() => setScope('GRADE_SECTION')}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-ink">
                  Selected grades &amp; sections
                </span>
                <span className="text-xs text-muted">
                  Only students matching the grade and section you choose
                </span>
              </span>
            </label>
          </fieldset>

          {scope === 'GRADE_SECTION' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">Grades &amp; sections</p>
              {isLoading ? (
                <p className="text-sm text-muted">Loading school academics…</p>
              ) : combinations.length === 0 ? (
                <p className="text-sm text-muted">
                  Configure grades and sections under School Admin → Academics first.
                </p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2">
                  {combinations.map(({ grade, section }) => {
                    const key = targetKey(grade, section);
                    return (
                      <li key={key}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selected.has(key)}
                            onChange={() => toggleTarget(grade, section)}
                          />
                          <span className="text-sm text-ink">
                            {grade} · Section {section}
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPublishing}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPublishing ||
                (scope === 'GRADE_SECTION' && (combinations.length === 0 || selected.size === 0))
              }
            >
              {isPublishing ? 'Publishing…' : 'Publish'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
