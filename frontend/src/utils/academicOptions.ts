import { GRADES } from '@/constants/academics';

const CANONICAL_GRADE_ORDER = GRADES as readonly string[];

function uniqueNonEmpty(values: (string | null | undefined)[]): string[] {
  return [...new Set(values.map((v) => v?.trim()).filter((v): v is string => Boolean(v)))];
}

/** Case-insensitive A–Z sort for subjects, topics, and other label lists. */
export function sortAlphabetically(values: readonly string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function uniqueAlphabetically(values: (string | null | undefined)[]): string[] {
  return sortAlphabetically(uniqueNonEmpty(values));
}

function gradeRank(grade: string, schoolOrder: readonly string[]): number {
  const schoolIdx = schoolOrder.indexOf(grade);
  if (schoolIdx >= 0) return schoolIdx;
  const canonicalIdx = CANONICAL_GRADE_ORDER.indexOf(grade as (typeof GRADES)[number]);
  if (canonicalIdx >= 0) return schoolOrder.length + canonicalIdx;
  return schoolOrder.length + CANONICAL_GRADE_ORDER.length;
}

/**
 * Sort grades Pre-KG → Class 12 using school admin order when available,
 * then canonical grade order for extras (e.g. legacy quiz metadata).
 */
export function sortGrades(values: readonly string[], schoolOrder: readonly string[]): string[] {
  const order = schoolOrder.length > 0 ? schoolOrder : CANONICAL_GRADE_ORDER;
  return uniqueNonEmpty([...values]).sort((a, b) => {
    const diff = gradeRank(a, order) - gradeRank(b, order);
    return diff !== 0 ? diff : a.localeCompare(b, undefined, { sensitivity: 'base' });
  });
}

export function mergeGradeOptions(
  schoolGrades: readonly string[],
  fromData: readonly string[],
): string[] {
  return sortGrades([...new Set([...schoolGrades, ...fromData])], schoolGrades);
}

export function mergeSubjectOptions(
  schoolSubjects: readonly string[],
  fromData: readonly string[],
): string[] {
  return sortAlphabetically([...new Set([...schoolSubjects, ...fromData])]);
}

export function mergeTopicOptions(
  configured: readonly string[],
  fromData: readonly string[],
): string[] {
  return sortAlphabetically([...new Set([...configured, ...fromData])]);
}
