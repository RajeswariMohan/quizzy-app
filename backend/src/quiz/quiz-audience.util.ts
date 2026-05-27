import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';

export interface QuizAudienceTarget {
  grade: string;
  section: string;
}

export function normalizeAudienceTargets(
  raw: unknown,
): QuizAudienceTarget[] {
  if (!Array.isArray(raw)) return [];
  const out: QuizAudienceTarget[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const grade = String((item as { grade?: unknown }).grade ?? '').trim();
    const section = String((item as { section?: unknown }).section ?? '').trim();
    if (!grade || !section) continue;
    const key = `${grade}\0${section}`;
    if (out.some((t) => `${t.grade}\0${t.section}` === key)) continue;
    out.push({ grade, section });
  }
  return out;
}

export function isQuizVisibleToStudent(
  scope: QuizAudienceScope,
  targets: QuizAudienceTarget[],
  studentGrade: string | null | undefined,
  studentSection: string | null | undefined,
): boolean {
  if (scope === QuizAudienceScope.SCHOOL) {
    return true;
  }
  const grade = studentGrade?.trim();
  const section = studentSection?.trim();
  if (!grade || !section || targets.length === 0) {
    return false;
  }
  return targets.some((t) => t.grade === grade && t.section === section);
}

export function formatAudienceTargetsLabel(targets: QuizAudienceTarget[]): string {
  if (targets.length === 0) return '';
  return targets.map((t) => `${t.grade} · ${t.section}`).join(', ');
}
