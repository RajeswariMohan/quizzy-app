/** Trim and collapse whitespace; empty input becomes null. */
export function normalizeQuizTopic(raw?: string | null): string | null {
  if (raw == null) return null;
  const normalized = raw.trim().replace(/\s+/g, ' ');
  return normalized.length > 0 ? normalized : null;
}

export function hasQuizTopic(topic: string | null | undefined): boolean {
  return normalizeQuizTopic(topic) !== null;
}
