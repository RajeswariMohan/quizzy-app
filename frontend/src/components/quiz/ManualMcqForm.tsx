import { useEffect, useState, type ReactNode } from 'react';
import { CheckCircle2, Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getApiErrorMessage, logApiError } from '@/api/client';
import type { ManualQuestionPayload } from '@/types/quiz';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

function emptyOptions(): [string, string, string, string] {
  return ['', '', '', ''];
}

function toOptionTuple(options: string[]): [string, string, string, string] {
  return [options[0] ?? '', options[1] ?? '', options[2] ?? '', options[3] ?? ''];
}

interface ManualMcqFormProps {
  disabled?: boolean;
  /** Unique id for radio groups when multiple forms are on the page */
  formId?: string;
  initial?: ManualQuestionPayload;
  submitLabel?: string;
  extraActions?: ReactNode;
  onCancel?: () => void;
  onSubmit: (payload: ManualQuestionPayload) => Promise<void>;
}

export function ManualMcqForm({
  disabled,
  formId = 'new',
  initial,
  submitLabel,
  extraActions,
  onCancel,
  onSubmit,
}: ManualMcqFormProps) {
  const isEditMode = Boolean(initial);
  const [questionText, setQuestionText] = useState(initial?.questionText ?? '');
  const [options, setOptions] = useState<[string, string, string, string]>(
    initial ? toOptionTuple(initial.options) : emptyOptions,
  );
  const [correctOptionIndex, setCorrectOptionIndex] = useState(
    initial?.correctOptionIndex ?? 0,
  );
  const [explanation, setExplanation] = useState(initial?.explanation ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setQuestionText(initial.questionText);
    setOptions(toOptionTuple(initial.options));
    setCorrectOptionIndex(initial.correctOptionIndex);
    setExplanation(initial.explanation ?? '');
    setError(null);
  }, [initial]);

  const setOption = (index: number, value: string) => {
    setOptions((prev) => {
      const next: [string, string, string, string] = [...prev];
      next[index] = value;
      return next;
    });
  };

  const validate = (): string | null => {
    if (!questionText.trim()) return 'Enter the question text.';
    for (let i = 0; i < 4; i += 1) {
      if (!options[i].trim()) {
        return `Option ${OPTION_LABELS[i]} cannot be empty.`;
      }
    }
    return null;
  };

  const resetForm = () => {
    setQuestionText('');
    setOptions(emptyOptions());
    setCorrectOptionIndex(0);
    setExplanation('');
    setError(null);
  };

  const handleCancel = () => {
    if (!isEditMode) {
      resetForm();
    }
    onCancel?.();
  };

  const showCancel = isEditMode ? Boolean(onCancel) : true;

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await onSubmit({
        questionText: questionText.trim(),
        options: options.map((o) => o.trim()) as [string, string, string, string],
        correctOptionIndex,
        explanation: explanation.trim() || undefined,
      });
      if (!isEditMode) {
        resetForm();
      }
    } catch (err) {
      logApiError('Save manual MCQ failed', err);
      setError(getApiErrorMessage(err, 'Could not save question.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Question</label>
        <textarea
          className="min-h-[88px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="e.g. Which gas do plants absorb during photosynthesis?"
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
          disabled={disabled || isSaving}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-ink">
          Answer options <span className="font-normal text-muted">(select the correct one)</span>
        </legend>
        {OPTION_LABELS.map((label, index) => (
          <div
            key={label}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition ${
              correctOptionIndex === index
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 bg-white'
            }`}
          >
            <input
              type="radio"
              name={`correctOption-${formId}`}
              className="h-4 w-4 shrink-0 accent-primary"
              checked={correctOptionIndex === index}
              onChange={() => setCorrectOptionIndex(index)}
              disabled={disabled || isSaving}
              aria-label={`Mark option ${label} as correct`}
            />
            <span className="w-5 shrink-0 text-sm font-semibold text-muted">{label}.</span>
            <input
              type="text"
              className="min-w-0 flex-1 border-0 bg-transparent py-1 text-sm outline-none focus:ring-0"
              placeholder={`Option ${label}`}
              value={options[index]}
              onChange={(e) => setOption(index, e.target.value)}
              disabled={disabled || isSaving}
            />
            {correctOptionIndex === index && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            )}
          </div>
        ))}
      </fieldset>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">
          Explanation <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          className="min-h-[64px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
          placeholder="Shown to students after they answer…"
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          disabled={disabled || isSaving}
        />
      </div>

      {error && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleSave}
          disabled={disabled || isSaving}
          className="w-full sm:w-auto"
        >
          {isEditMode ? (
            <Save className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {isSaving ? 'Saving…' : submitLabel ?? (isEditMode ? 'Save changes' : 'Add question')}
        </Button>
        {showCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={disabled || isSaving}
          >
            Cancel
          </Button>
        )}
        {extraActions}
      </div>
    </div>
  );
}
