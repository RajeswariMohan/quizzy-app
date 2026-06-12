import { useEffect, useId, useMemo, useState } from 'react';
import { fetchQuizTopicSuggestions } from '@/api/quiz.api';
import { logApiError } from '@/api/client';
import {
  mergeQuizFormTopicSuggestions,
  type QuizAcademicLink,
} from '@/utils/quizFilters';
import { normalizeQuizTopicInput, QUIZ_TOPIC_FIELD_HINT } from '@/utils/quizTopic';

interface QuizTopicFieldProps {
  topicLinks: QuizAcademicLink[];
  grade: string;
  subject: string;
  topic: string;
  onChange: (topic: string) => void;
  disabled?: boolean;
}

export function QuizTopicField({
  topicLinks,
  grade,
  subject,
  topic,
  onChange,
  disabled = false,
}: QuizTopicFieldProps) {
  const listId = useId();
  const [schoolTopics, setSchoolTopics] = useState<string[]>([]);

  useEffect(() => {
    const trimmedSubject = subject.trim();
    if (!trimmedSubject) {
      setSchoolTopics([]);
      return;
    }

    let cancelled = false;
    const trimmedGrade = grade.trim();

    fetchQuizTopicSuggestions({
      subject: trimmedSubject,
      ...(trimmedGrade ? { grade: trimmedGrade } : {}),
    })
      .then((res) => {
        if (!cancelled) setSchoolTopics(res.topics ?? []);
      })
      .catch((err) => {
        logApiError('Load topic suggestions failed', err);
        if (!cancelled) setSchoolTopics([]);
      });

    return () => {
      cancelled = true;
    };
  }, [subject, grade]);

  const suggestions = useMemo(
    () =>
      mergeQuizFormTopicSuggestions(schoolTopics, topicLinks, grade, subject, topic),
    [schoolTopics, topicLinks, grade, subject, topic],
  );

  const showSuggestionsHint = subject.trim().length > 0;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink" htmlFor={`${listId}-input`}>
        Topic
      </label>
      <input
        id={`${listId}-input`}
        list={listId}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-gray-50"
        placeholder="e.g. Photosynthesis"
        value={topic}
        onChange={(e) => onChange(normalizeQuizTopicInput(e.target.value))}
        readOnly={disabled}
      />
      <datalist id={listId}>
        {suggestions.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
      {showSuggestionsHint && suggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={disabled}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-ink hover:border-primary/40 disabled:opacity-50"
              onClick={() => onChange(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
      <p className="mt-1 text-xs text-muted">
        {showSuggestionsHint
          ? 'Topics used at your school for this subject — pick a suggestion or type a new one. '
          : 'Select a subject to see topic suggestions. '}
        {QUIZ_TOPIC_FIELD_HINT}
      </p>
    </div>
  );
}
