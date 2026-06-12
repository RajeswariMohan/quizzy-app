import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';
import {
  normalizeAudienceTargets,
  QuizAudienceTarget,
} from '../quiz/quiz-audience.util';

export interface PublishedAudienceCatalog {
  grades: string[];
  sectionsByGrade: Record<string, string[]>;
  hasSchoolWidePublished: boolean;
}

interface PublishedQuizAudienceSource {
  audienceScope: QuizAudienceScope;
  audienceTargets: unknown;
}

/**
 * Distinct grade/section pairs from published quizzes, intersected with school academics.
 */
export function collectPublishedAudienceCatalog(
  quizzes: PublishedQuizAudienceSource[],
  academics: { grades: string[]; gradeSections: Record<string, string[]> },
): PublishedAudienceCatalog {
  const gradeSet = new Set<string>();
  const sectionsByGrade = new Map<string, Set<string>>();
  let hasSchoolWidePublished = false;

  for (const quiz of quizzes) {
    if (quiz.audienceScope === QuizAudienceScope.SCHOOL) {
      hasSchoolWidePublished = true;
      continue;
    }
    const targets = normalizeAudienceTargets(quiz.audienceTargets);
    for (const target of targets) {
      addTarget(gradeSet, sectionsByGrade, target, academics);
    }
  }

  const gradeOrder = academics.grades;
  const grades = [...gradeSet].sort((a, b) => {
    const ia = gradeOrder.indexOf(a);
    const ib = gradeOrder.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });

  const sectionsRecord: Record<string, string[]> = {};
  for (const grade of grades) {
    const configured = academics.gradeSections[grade] ?? [];
    const published = sectionsByGrade.get(grade);
    if (!published || published.size === 0) {
      sectionsRecord[grade] = [];
      continue;
    }
    const list = [...published];
    sectionsRecord[grade] = list.sort((a, b) => {
      const ia = configured.indexOf(a);
      const ib = configured.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  return { grades, sectionsByGrade: sectionsRecord, hasSchoolWidePublished };
}

function addTarget(
  gradeSet: Set<string>,
  sectionsByGrade: Map<string, Set<string>>,
  target: QuizAudienceTarget,
  academics: { grades: string[]; gradeSections: Record<string, string[]> },
): void {
  const grade = target.grade.trim();
  if (!grade || !academics.grades.includes(grade)) return;

  gradeSet.add(grade);

  const section = target.section?.trim();
  if (!section) return;

  const configured = academics.gradeSections[grade] ?? [];
  if (configured.length > 0 && !configured.includes(section)) {
    return;
  }

  const set = sectionsByGrade.get(grade) ?? new Set<string>();
  set.add(section);
  sectionsByGrade.set(grade, set);
}

export function isGradeInPublishedCatalog(
  catalog: PublishedAudienceCatalog,
  grade: string,
): boolean {
  return catalog.grades.includes(grade.trim());
}

export function isSectionInPublishedCatalog(
  catalog: PublishedAudienceCatalog,
  grade: string,
  section: string,
): boolean {
  const list = catalog.sectionsByGrade[grade.trim()] ?? [];
  return list.includes(section.trim());
}
