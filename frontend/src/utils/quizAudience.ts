import type { QuizAudienceScope, QuizAudienceTarget, QuizSummary } from '@/types/quiz';
import type { SchoolSubscriptionTier } from '@/api/schoolAdmin.api';

export function formatAudienceLabel(
  scope: QuizAudienceScope | undefined,
  targets: QuizAudienceTarget[] | undefined,
): string {
  if (scope === 'SCHOOL' || !scope) {
    return scope === 'SCHOOL' ? 'All students' : '';
  }
  if (scope === 'GRADE') {
    if (!targets?.length) return 'Selected grades';
    return targets.map((t) => t.grade).join(', ');
  }
  if (!targets?.length) return 'Selected grades & sections';
  return targets.map((t) => (t.section ? `${t.grade} · ${t.section}` : t.grade)).join(', ');
}

export function buildDefaultPublishTargets(
  quiz: Pick<QuizSummary, 'grade' | 'classSection'>,
  gradeSections: Record<string, string[]>,
): QuizAudienceTarget[] {
  const grade = quiz.grade?.trim();
  if (!grade || !gradeSections[grade]) return [];

  const classSection = quiz.classSection?.trim();
  const sections = gradeSections[grade] ?? [];
  if (classSection && sections.includes(classSection)) {
    return [{ grade, section: classSection }];
  }

  return sections.map((section) => ({ grade, section }));
}

export function targetKey(grade: string, section?: string): string {
  return section ? `${grade}::${section}` : `${grade}::__grade__`;
}

export function allowedPublishScopes(tier: SchoolSubscriptionTier): QuizAudienceScope[] {
  if (tier === 'PREMIUM') return ['SCHOOL', 'GRADE', 'GRADE_SECTION'];
  if (tier === 'STANDARD') return ['SCHOOL', 'GRADE'];
  return ['GRADE'];
}

export const PUBLISH_SCOPE_LABELS: Record<
  QuizAudienceScope,
  { title: string; description: string }
> = {
  SCHOOL: {
    title: 'All students',
    description: 'Every student in your school',
  },
  GRADE: {
    title: 'Selected grades',
    description: 'All sections in the grades you choose (class level)',
  },
  GRADE_SECTION: {
    title: 'Selected grades & sections',
    description: 'Only students in the specific sections you choose',
  },
};
