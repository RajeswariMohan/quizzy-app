import type { QuizAudienceScope, QuizAudienceTarget, QuizSummary } from '@/types/quiz';

export function formatAudienceLabel(
  scope: QuizAudienceScope | undefined,
  targets: QuizAudienceTarget[] | undefined,
): string {
  if (scope === 'SCHOOL' || !scope) {
    return scope === 'SCHOOL' ? 'All students' : '';
  }
  if (!targets?.length) return 'Selected grades & sections';
  return targets.map((t) => `${t.grade} · ${t.section}`).join(', ');
}

export function buildDefaultPublishTargets(
  quiz: Pick<QuizSummary, 'grade' | 'classSection'>,
  grades: string[],
  sections: string[],
): QuizAudienceTarget[] {
  const grade = quiz.grade?.trim();
  if (!grade || !grades.includes(grade)) return [];

  const classSection = quiz.classSection?.trim();
  if (classSection && sections.includes(classSection)) {
    return [{ grade, section: classSection }];
  }

  return sections.map((section) => ({ grade, section }));
}

export function targetKey(grade: string, section: string): string {
  return `${grade}::${section}`;
}
