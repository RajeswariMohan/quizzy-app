import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { useSchoolFeatures } from '@/hooks/useSchoolFeatures';
import type { PublishQuizPayload, QuizAudienceScope, QuizSummary } from '@/types/quiz';
import {
  buildDefaultPublishTargets,
  PUBLISH_SCOPE_LABELS,
  targetKey,
} from '@/utils/quizAudience';

interface PublishQuizDialogProps {
  quiz: Pick<QuizSummary, 'id' | 'title' | 'grade' | 'classSection'>;
  onClose: () => void;
  onConfirm: (payload: PublishQuizPayload) => Promise<void>;
}

export function PublishQuizDialog({ quiz, onClose, onConfirm }: PublishQuizDialogProps) {
  const { gradeSections, isLoading } = useSchoolAcademics();
  const { features } = useSchoolFeatures();
  const scopes = features.allowedPublishScopes;

  const defaultTargets = useMemo(
    () => buildDefaultPublishTargets(quiz, gradeSections),
    [quiz, gradeSections],
  );

  const defaultScope: QuizAudienceScope =
    defaultTargets.length > 0 && scopes.includes('GRADE_SECTION')
      ? 'GRADE_SECTION'
      : scopes.includes('GRADE')
        ? 'GRADE'
        : 'SCHOOL';

  const [scope, setScope] = useState<QuizAudienceScope>(defaultScope);
  const [selectedGrades, setSelectedGrades] = useState<Set<string>>(() =>
    new Set(defaultTargets.map((t) => t.grade)),
  );
  const [selectedSections, setSelectedSections] = useState<Set<string>>(() =>
    new Set(defaultTargets.map((t) => targetKey(t.grade, t.section))),
  );
  const [error, setError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const grades = useMemo(() => Object.keys(gradeSections), [gradeSections]);

  const sectionCombinations = useMemo(
    () =>
      grades.flatMap((grade) =>
        (gradeSections[grade] ?? []).map((section) => ({ grade, section })),
      ),
    [grades, gradeSections],
  );

  const toggleGrade = (grade: string) => {
    setSelectedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  const toggleSectionTarget = (grade: string, section: string) => {
    const key = targetKey(grade, section);
    setSelectedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let payload: PublishQuizPayload;

    if (scope === 'SCHOOL') {
      payload = { audienceScope: 'SCHOOL' };
    } else if (scope === 'GRADE') {
      if (selectedGrades.size === 0) {
        setError('Select at least one grade.');
        return;
      }
      payload = {
        audienceScope: 'GRADE',
        targets: Array.from(selectedGrades).map((grade) => ({ grade })),
      };
    } else {
      if (selectedSections.size === 0) {
        setError('Select at least one grade and section.');
        return;
      }
      payload = {
        audienceScope: 'GRADE_SECTION',
        targets: Array.from(selectedSections).map((key) => {
          const [grade, section] = key.split('::');
          return { grade, section };
        }),
      };
    }

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

  const packageHint =
    features.publishScopeSection
      ? 'section-level publishing enabled'
      : features.publishScopeSchool
        ? 'school-wide or grade-level publishing'
        : 'grade-level publishing only';

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
        <p className="mt-1 text-xs text-muted">
          Package: {features.subscriptionTier.toLowerCase()} — {packageHint}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">Who can take this quiz?</legend>
            {scopes.map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-100 px-3 py-2.5"
              >
                <input
                  type="radio"
                  name="audienceScope"
                  value={value}
                  checked={scope === value}
                  onChange={() => setScope(value)}
                  className="mt-1"
                />
                <span>
                  <span className="block text-sm font-medium text-ink">
                    {PUBLISH_SCOPE_LABELS[value].title}
                  </span>
                  <span className="text-xs text-muted">{PUBLISH_SCOPE_LABELS[value].description}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {scope === 'GRADE' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">Grades</p>
              {isLoading ? (
                <p className="text-sm text-muted">Loading school academics…</p>
              ) : grades.length === 0 ? (
                <p className="text-sm text-muted">
                  Configure grades and sections under School Admin → Academics first.
                </p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2">
                  {grades.map((grade) => (
                    <li key={grade}>
                      <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selectedGrades.has(grade)}
                          onChange={() => toggleGrade(grade)}
                        />
                        <span className="text-sm text-ink">{grade}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {scope === 'GRADE_SECTION' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-ink">Grades &amp; sections</p>
              {isLoading ? (
                <p className="text-sm text-muted">Loading school academics…</p>
              ) : sectionCombinations.length === 0 ? (
                <p className="text-sm text-muted">
                  Configure grades and sections under School Admin → Academics first.
                </p>
              ) : (
                <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2">
                  {sectionCombinations.map(({ grade, section }) => {
                    const key = targetKey(grade, section);
                    return (
                      <li key={key}>
                        <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={selectedSections.has(key)}
                            onChange={() => toggleSectionTarget(grade, section)}
                          />
                          <span className="text-sm text-ink">
                            {grade} · {section}
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
                (scope === 'GRADE' && selectedGrades.size === 0) ||
                (scope === 'GRADE_SECTION' &&
                  (sectionCombinations.length === 0 || selectedSections.size === 0))
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
