import type { AnalyticsCreatorOption, AnalyticsFilterOptions, AnalyticsQueryFilters } from '@/api/dashboard.api';
import {
  mergeGradeOptions,
  mergeSubjectOptions,
  sortAlphabetically,
  sortGrades,
} from '@/utils/academicOptions';
import { formatUserRole } from '@/utils/userRole';

export const ANALYTICS_FILTER_ALL = 'All';

export type AnalyticsFilterLink = {
  grade: string;
  subject: string;
  board?: string;
  topic: string;
};

export function withAllOption(values: string[]): string[] {
  return [ANALYTICS_FILTER_ALL, ...values];
}

export function mergeAnalyticsFilterOptions(
  options: AnalyticsFilterOptions,
  schoolGrades: string[],
  schoolSubjects: string[],
): AnalyticsFilterOptions {
  return {
    ...options,
    grades: mergeGradeOptions(schoolGrades, options.grades),
    subjects: mergeSubjectOptions(schoolSubjects, options.subjects),
    topics: sortAlphabetically(options.topics),
  };
}

export function getLinkedFilterValues(
  links: AnalyticsFilterLink[],
  filters: AnalyticsQueryFilters,
  fallback: Pick<AnalyticsFilterOptions, 'grades' | 'subjects' | 'topics'>,
) {
  if (links.length === 0) {
    return {
      grades: sortGrades(fallback.grades, fallback.grades),
      subjects: sortAlphabetically(fallback.subjects),
      topics: sortAlphabetically(fallback.topics),
    };
  }

  const match = (link: AnalyticsFilterLink, omit: 'grade' | 'subject' | 'topic') => {
    if (omit !== 'grade' && filters.grade && link.grade !== filters.grade) return false;
    if (omit !== 'subject' && filters.subject && link.subject !== filters.subject) return false;
    if (omit !== 'topic' && filters.topic && link.topic !== filters.topic) return false;
    return true;
  };

  return {
    grades: sortGrades(
      [...new Set(links.filter((l) => match(l, 'grade')).map((l) => l.grade))],
      fallback.grades,
    ),
    subjects: sortAlphabetically([
      ...new Set(links.filter((l) => match(l, 'subject')).map((l) => l.subject)),
    ]),
    topics: sortAlphabetically([
      ...new Set(links.filter((l) => match(l, 'topic')).map((l) => l.topic)),
    ]),
  };
}

export function formatCreatorOptionLabel(creator: AnalyticsCreatorOption): string {
  return `${creator.displayName} (${formatUserRole(creator.role)})`;
}

export function buildCreatorOptionLabels(creators: AnalyticsCreatorOption[] | undefined): string[] {
  return (creators ?? []).map(formatCreatorOptionLabel);
}

export function buildCreatorLabelByUserId(
  creators: AnalyticsCreatorOption[] | undefined,
): Map<string, string> {
  return new Map((creators ?? []).map((c) => [c.userId, formatCreatorOptionLabel(c)]));
}

export function resolveCreatorUserId(
  label: string,
  creators: AnalyticsCreatorOption[] | undefined,
): string | undefined {
  if (label === ANALYTICS_FILTER_ALL) return undefined;
  return (creators ?? []).find((c) => formatCreatorOptionLabel(c) === label)?.userId;
}

/** Narrow creator options to those present in the current quiz list (e.g. after grade filter). */
export function filterCreatorsByQuizzes(
  creators: AnalyticsCreatorOption[] | undefined,
  quizzes: Array<{ createdBy?: { userId: string } | null }>,
): AnalyticsCreatorOption[] {
  const list = creators ?? [];
  const ids = new Set(
    quizzes.map((q) => q.createdBy?.userId).filter((id): id is string => Boolean(id)),
  );
  if (ids.size === 0) return list;
  return list.filter((c) => ids.has(c.userId));
}

export function applyAnalyticsFilterField(
  filters: AnalyticsQueryFilters,
  key: keyof AnalyticsQueryFilters,
  raw: string,
  linkedTopics: string[],
  allTopics: string[],
  linksCount: number,
): AnalyticsQueryFilters {
  const value = raw === ANALYTICS_FILTER_ALL ? undefined : raw;
  const next: AnalyticsQueryFilters = { ...filters, [key]: value || undefined };

  if ((key === 'grade' || key === 'subject') && next.topic) {
    const topicPool = linksCount === 0 ? allTopics : linkedTopics;
    if (!topicPool.includes(next.topic)) {
      next.topic = undefined;
    }
  }

  if (key === 'grade' && next.createdByUserId) {
    // Server refetch validates creator against grade-scoped quizzes.
  }

  return next;
}
