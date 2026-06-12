/** Trim and collapse whitespace; empty input becomes empty string for form state. */
export function normalizeQuizTopicInput(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ');
}

export function normalizeQuizTopicForApi(raw: string): string | undefined {
  const normalized = normalizeQuizTopicInput(raw);
  return normalized.length > 0 ? normalized : undefined;
}

export function hasQuizTopic(topic: string | null | undefined): boolean {
  return normalizeQuizTopicInput(topic ?? '').length > 0;
}

export const QUIZ_TOPIC_PUBLISH_MESSAGE =
  'Add a short topic name in quiz details before publishing (e.g. Photosynthesis). Do not use the quiz title as the topic.';

export const QUIZ_TOPIC_FIELD_HINT =
  'Use a short curriculum label (e.g. Fractions, Photosynthesis), not the quiz title.';
