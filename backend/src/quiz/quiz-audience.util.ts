import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';
import { isSeniorSecondaryGrade } from '../school-admin/academic-section-filter.util';

export interface QuizAudienceTarget {
  grade: string;
  section?: string;
}

const SENIOR_COMPOSITE_SEP = ' · ';

/**
 * Match student or filter section to a publish target (Class 11/12).
 * A student in "Science · A" matches target "Science"; not the reverse.
 */
export function sectionMatchesAudienceTarget(
  studentOrFilterSection: string,
  targetSection: string,
  grade: string,
): boolean {
  const student = studentOrFilterSection.trim();
  const target = targetSection.trim();
  if (!student || !target) return false;
  if (student === target) return true;

  if (!isSeniorSecondaryGrade(grade)) {
    return false;
  }

  if (
    !target.includes(SENIOR_COMPOSITE_SEP) &&
    student.startsWith(`${target}${SENIOR_COMPOSITE_SEP}`)
  ) {
    return true;
  }

  return false;
}

/** Filter section vs publish target (department filter includes composite sections). */
export function sectionMatchesPublishedFilter(
  filterSection: string,
  targetSection: string,
  grade: string,
): boolean {
  if (sectionMatchesAudienceTarget(filterSection, targetSection, grade)) {
    return true;
  }
  const filter = filterSection.trim();
  const target = targetSection.trim();
  if (
    isSeniorSecondaryGrade(grade) &&
    !filter.includes(SENIOR_COMPOSITE_SEP) &&
    target.startsWith(`${filter}${SENIOR_COMPOSITE_SEP}`)
  ) {
    return true;
  }
  return false;
}

export function normalizeAudienceTargets(
  raw: unknown,
): QuizAudienceTarget[] {
  if (!Array.isArray(raw)) return [];
  const out: QuizAudienceTarget[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const grade = String((item as { grade?: unknown }).grade ?? '').trim();
    const sectionRaw = (item as { section?: unknown }).section;
    const section =
      sectionRaw === null || sectionRaw === undefined
        ? ''
        : String(sectionRaw).trim();
    if (!grade) continue;
    const key = section ? `${grade}\0${section}` : `${grade}\0*`;
    if (out.some((t) => (t.section ? `${t.grade}\0${t.section}` : `${t.grade}\0*`) === key)) {
      continue;
    }
    out.push(section ? { grade, section } : { grade });
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
  if (!grade || targets.length === 0) {
    return false;
  }
  if (scope === QuizAudienceScope.GRADE) {
    return targets.some((t) => t.grade === grade);
  }
  const section = studentSection?.trim();
  if (!section) {
    return false;
  }
  return targets.some(
    (t) =>
      t.grade === grade &&
      t.section != null &&
      sectionMatchesAudienceTarget(section, t.section, grade),
  );
}

/** Whether a published quiz's audience matches a student browse/leaderboard filter. */
export function quizMatchesPublishedAudienceFilter(
  scope: QuizAudienceScope,
  rawTargets: unknown,
  filter: { grade: string; section?: string },
): boolean {
  const grade = filter.grade.trim();
  if (!grade) return false;

  const section = filter.section?.trim();
  const targets = normalizeAudienceTargets(rawTargets);

  if (scope === QuizAudienceScope.SCHOOL) {
    return false;
  }

  if (scope === QuizAudienceScope.GRADE) {
    if (section) return false;
    return targets.some((t) => t.grade === grade);
  }

  if (!section) {
    return targets.some((t) => t.grade === grade);
  }

  return targets.some(
    (t) =>
      t.grade === grade &&
      t.section != null &&
      sectionMatchesPublishedFilter(section, t.section, grade),
  );
}

export function formatAudienceTargetsLabel(targets: QuizAudienceTarget[]): string {
  if (targets.length === 0) return '';
  return targets
    .map((t) => (t.section ? `${t.grade} · ${t.section}` : t.grade))
    .join(', ');
}
