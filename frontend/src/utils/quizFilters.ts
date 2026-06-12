import type { QuizStatus, QuizSummary } from '@/types/quiz';
import {
  DEFAULT_ACADEMIC_GROUP_FILTER,
  FILTER_ALL,
  quizMatchesAcademicGroup,
  type AcademicGroupFilterValues,
} from '@/utils/gradeStructure';
import {
  mergeSubjectOptions,
  mergeTopicOptions,
  sortGrades,
  uniqueAlphabetically,
} from '@/utils/academicOptions';
import { GRADES } from '@/constants/academics';
import { getQuizSectionLabel, resolveQuizGrade } from '@/utils/quizMeta';

export interface QuizAcademicLink {
  grade: string;
  subject: string;
  topic?: string;
}

/** @deprecated Alias for quiz history tuples with topic (filters/forms). */
export type QuizTopicLink = QuizAcademicLink & { topic: string };

function prependCurrentOption(pool: string[], current?: string): string[] {
  const trimmed = current?.trim();
  if (trimmed && !pool.includes(trimmed)) {
    return [trimmed, ...pool];
  }
  return pool;
}

/** Grade/subject/topic combinations from the teacher's quizzes (topic optional). */
export function buildQuizAcademicLinks(quizzes: QuizSummary[]): QuizAcademicLink[] {
  const seen = new Set<string>();
  const links: QuizAcademicLink[] = [];
  for (const quiz of quizzes) {
    const grade = resolveQuizGrade(quiz);
    const subject = quiz.subject?.trim();
    if (!grade || !subject) continue;
    const topic = quiz.topic?.trim();
    const key = topic ? `${grade}\0${subject}\0${topic}` : `${grade}\0${subject}`;
    if (seen.has(key)) continue;
    seen.add(key);
    links.push(topic ? { grade, subject, topic } : { grade, subject });
  }
  return links;
}

export function buildQuizTopicLinks(quizzes: QuizSummary[]): QuizTopicLink[] {
  return buildQuizAcademicLinks(quizzes)
    .filter((link): link is QuizTopicLink => !!link.topic?.trim())
    .map((link) => ({
      grade: link.grade,
      subject: link.subject,
      topic: link.topic!.trim(),
    }));
}

export function getLinkedGradeOptions(
  links: QuizAcademicLink[],
  currentGrade?: string,
  schoolOrder: readonly string[] = [],
): string[] {
  if (links.length === 0) return [];
  return prependCurrentOption(
    sortGrades(
      links.map((link) => link.grade),
      schoolOrder,
    ),
    currentGrade,
  );
}

export function getLinkedSubjectOptions(
  links: QuizAcademicLink[],
  grade: string,
  currentSubject?: string,
): string[] {
  if (links.length === 0) return [];
  const filtered = grade
    ? links.filter((link) => link.grade === grade)
    : links;
  return prependCurrentOption(
    uniqueAlphabetically(filtered.map((link) => link.subject)),
    currentSubject,
  );
}

export function getLinkedQuizFilterValues(
  links: QuizAcademicLink[],
  grade: string,
  subject: string,
  fallback: { grades: string[]; subjects: string[]; topics: string[] },
  schoolOrder: readonly string[] = [],
): { grades: string[]; subjects: string[]; topics: string[] } {
  if (links.length === 0) {
    return {
      grades: sortGrades(fallback.grades, schoolOrder),
      subjects: uniqueAlphabetically(fallback.subjects),
      topics: uniqueAlphabetically(fallback.topics),
    };
  }

  const gradeFilter = grade === FILTER_ALL ? undefined : grade;
  const subjectFilter = subject === FILTER_ALL ? undefined : subject;

  const match = (link: QuizAcademicLink, omit: 'grade' | 'subject' | 'topic') => {
    if (omit !== 'grade' && gradeFilter && link.grade !== gradeFilter) return false;
    if (omit !== 'subject' && subjectFilter && link.subject !== subjectFilter) {
      return false;
    }
    return true;
  };

  const topics = links
    .filter((link) => link.topic?.trim() && match(link, 'topic'))
    .map((link) => link.topic!.trim());

  return {
    grades: sortGrades(
      links.filter((l) => match(l, 'grade')).map((l) => l.grade),
      schoolOrder,
    ),
    subjects: uniqueAlphabetically(
      links.filter((l) => match(l, 'subject')).map((l) => l.subject),
    ),
    topics: uniqueAlphabetically(topics),
  };
}

/** Subject dropdown on create/edit: full school list plus topics used on teacher quizzes. */
export function getQuizFormSubjectOptions(
  links: QuizAcademicLink[],
  grade: string,
  schoolSubjects: string[],
  currentSubject?: string,
): string[] {
  const linked = getLinkedSubjectOptions(links, grade, currentSubject);
  return mergeSubjectOptions(schoolSubjects, linked);
}

/** Merge school-wide API topics with own quiz history; keep current typed value. */
export function mergeQuizFormTopicSuggestions(
  schoolTopics: string[],
  links: QuizAcademicLink[],
  grade: string,
  subject: string,
  currentTopic?: string,
): string[] {
  const fromOwnQuizzes = getLinkedTopicOptions(links, grade, subject);
  return prependCurrentOption(
    mergeTopicOptions(schoolTopics, fromOwnQuizzes),
    currentTopic,
  );
}

/** Clear subject on grade change if not in school + linked pool (create/edit forms). */
export function coerceSubjectForGradeForm(
  subject: string,
  links: QuizAcademicLink[],
  grade: string,
  schoolSubjects: string[],
): string {
  const trimmed = subject.trim();
  if (!trimmed) return subject;
  const pool = getQuizFormSubjectOptions(links, grade, schoolSubjects);
  return pool.includes(trimmed) ? subject : '';
}

/** Clear subject when grade changes and it is not in the linked pool. */
export function coerceSubjectForGrade(
  subject: string,
  links: QuizAcademicLink[],
  grade: string,
): string {
  const trimmed = subject.trim();
  if (!trimmed) return subject;
  if (links.length === 0) return subject;
  const pool = getLinkedSubjectOptions(links, grade);
  if (pool.length === 0) return subject;
  return pool.includes(trimmed) ? subject : '';
}

export function getLinkedTopicOptions(
  links: QuizAcademicLink[],
  grade: string,
  subject: string,
  currentTopic?: string,
): string[] {
  if (links.length === 0) return [];
  const filtered = links.filter((link) => {
    if (!link.topic?.trim()) return false;
    if (grade && link.grade !== grade) return false;
    if (subject && link.subject !== subject) return false;
    return true;
  });
  return prependCurrentOption(
    uniqueAlphabetically(filtered.map((link) => link.topic!.trim())),
    currentTopic,
  );
}

/** Clear topic when grade/subject change leaves it outside the linked pool. */
export function coerceTopicForGradeSubject(
  topic: string,
  links: QuizAcademicLink[],
  grade: string,
  subject: string,
): string {
  const trimmed = topic.trim();
  if (!trimmed) return topic;
  const pool = getLinkedTopicOptions(links, grade, subject);
  if (pool.length === 0) return topic;
  return pool.includes(trimmed) ? topic : '';
}

/**
 * Subject options for the quiz list filter bar.
 * Always includes school + quiz metadata; merges quiz-used subjects for the selected grade.
 */
export function getQuizListSubjectFilterOptions(
  links: QuizAcademicLink[],
  grade: string,
  subject: string,
  fallbackSubjects: string[],
): string[] {
  const currentSubject = subject !== FILTER_ALL ? subject : undefined;
  return getQuizFormSubjectOptions(links, grade, fallbackSubjects, currentSubject);
}

/**
 * Topic options for the quiz list filter bar.
 * Topics are stored on each quiz (`quiz.topic`), not in school academics config.
 * With quiz history: only show topics after grade and subject are chosen.
 */
export function getQuizListTopicFilterOptions(
  links: QuizAcademicLink[],
  grade: string,
  subject: string,
  fallbackTopics: string[],
): string[] {
  if (links.length === 0) return fallbackTopics;
  if (grade === FILTER_ALL || subject === FILTER_ALL) return [];
  return getLinkedQuizFilterValues(links, grade, subject, {
    grades: [],
    subjects: [],
    topics: fallbackTopics,
  }).topics;
}

/** Apply list-filter grade change: reset subject/topic when no longer valid. */
export function applyQuizListGradeChange(
  filters: QuizListFilters,
  nextGrade: string,
  links: QuizAcademicLink[],
  fallbackTopics: string[],
  fallbackSubjects: string[],
): QuizListFilters {
  const next: QuizListFilters = {
    ...filters,
    grade: nextGrade,
    academicGroup: { ...DEFAULT_ACADEMIC_GROUP_FILTER },
  };
  if (links.length === 0) return next;

  const subjectPool = getQuizListSubjectFilterOptions(
    links,
    nextGrade,
    FILTER_ALL,
    fallbackSubjects,
  );

  if (next.subject !== FILTER_ALL && !subjectPool.includes(next.subject)) {
    next.subject = FILTER_ALL;
  }

  const topicPool = getQuizListTopicFilterOptions(
    links,
    nextGrade,
    next.subject,
    fallbackTopics,
  );
  if (
    nextGrade === FILTER_ALL ||
    next.subject === FILTER_ALL ||
    (next.topic !== FILTER_ALL && !topicPool.includes(next.topic))
  ) {
    next.topic = FILTER_ALL;
  }
  return next;
}

/** Apply list-filter subject change: reset topic when no longer valid. */
export function applyQuizListSubjectChange(
  filters: QuizListFilters,
  nextSubject: string,
  links: QuizAcademicLink[],
  fallbackTopics: string[],
): QuizListFilters {
  const next: QuizListFilters = { ...filters, subject: nextSubject };
  if (links.length === 0) return next;

  const topicPool = getQuizListTopicFilterOptions(
    links,
    filters.grade,
    nextSubject,
    fallbackTopics,
  );
  if (
    filters.grade === FILTER_ALL ||
    nextSubject === FILTER_ALL ||
    (next.topic !== FILTER_ALL && !topicPool.includes(next.topic))
  ) {
    next.topic = FILTER_ALL;
  }
  return next;
}

export type QuizListStatusFilter = 'All' | QuizStatus;

export interface QuizListFilters {
  search: string;
  status: QuizListStatusFilter;
  grade: string;
  academicGroup: AcademicGroupFilterValues;
  subject: string;
  topic: string;
  sort: 'newest' | 'oldest' | 'title';
  /** ISO date (YYYY-MM-DD), inclusive */
  dateFrom: string;
  /** ISO date (YYYY-MM-DD), inclusive */
  dateTo: string;
}

export const QUIZ_STATUS_FILTER_OPTIONS: QuizListStatusFilter[] = [
  'All',
  'DRAFT',
  'PUBLISHED',
  'ARCHIVED',
];

export function quizStatusFilterLabel(status: QuizListStatusFilter): string {
  if (status === 'All') return 'All statuses';
  if (status === 'DRAFT') return 'Draft';
  if (status === 'PUBLISHED') return 'Published';
  return 'Archived';
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Default list window: last 365 days through today. */
export function buildDefaultQuizListFilters(): QuizListFilters {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setFullYear(dateFrom.getFullYear() - 1);
  return {
    search: '',
    status: 'All',
    grade: 'All',
    academicGroup: { ...DEFAULT_ACADEMIC_GROUP_FILTER },
    subject: 'All',
    topic: 'All',
    sort: 'newest',
    dateFrom: toIsoDate(dateFrom),
    dateTo: toIsoDate(dateTo),
  };
}

export const DEFAULT_QUIZ_LIST_FILTERS: QuizListFilters = buildDefaultQuizListFilters();

export interface QuizFilterOptions {
  grades: string[];
  subjects: string[];
  topics: string[];
}

export function buildQuizFilterOptions(quizzes: QuizSummary[]): QuizFilterOptions {
  return {
    grades: sortGrades(
      quizzes
        .map((q) => resolveQuizGrade(q))
        .filter((g): g is string => Boolean(g?.trim())),
      GRADES,
    ),
    subjects: uniqueAlphabetically(quizzes.map((q) => q.subject)),
    topics: uniqueAlphabetically(quizzes.map((q) => q.topic)),
  };
}

function academicGroupFilterActive(
  group: AcademicGroupFilterValues,
  defaults: AcademicGroupFilterValues,
): boolean {
  return (
    group.department !== defaults.department ||
    group.sectionLetter !== defaults.sectionLetter ||
    group.group !== defaults.group
  );
}

export function hasActiveQuizFilters(filters: QuizListFilters): boolean {
  const defaults = DEFAULT_QUIZ_LIST_FILTERS;
  return (
    filters.search.trim().length > 0 ||
    filters.status !== 'All' ||
    filters.grade !== 'All' ||
    academicGroupFilterActive(filters.academicGroup, defaults.academicGroup) ||
    filters.subject !== 'All' ||
    filters.topic !== 'All' ||
    filters.sort !== 'newest' ||
    filters.dateFrom !== defaults.dateFrom ||
    filters.dateTo !== defaults.dateTo
  );
}

export function filterQuizzesByStatus(
  quizzes: QuizSummary[],
  status: 'ALL' | QuizStatus,
): QuizSummary[] {
  if (status === 'ALL') return quizzes;
  return quizzes.filter((q) => q.status === status);
}

export function applyQuizListFilters(
  quizzes: QuizSummary[],
  filters: QuizListFilters,
  gradeSections: Record<string, string[]> = {},
): QuizSummary[] {
  const term = filters.search.trim().toLowerCase();
  let result = quizzes.filter((q) => {
    if (filters.status !== 'All' && q.status !== filters.status) {
      return false;
    }

    if (term) {
      const haystack = [
        q.title,
        q.subject,
        q.topic,
        q.board,
        q.grade,
        resolveQuizGrade(q),
        getQuizSectionLabel(q),
        q.className,
        q.schoolName,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }

    if (
      !quizMatchesAcademicGroup(
        q,
        {
          grade: filters.grade,
          gradeSections,
          department: filters.academicGroup.department,
          sectionLetter: filters.academicGroup.sectionLetter,
          group: filters.academicGroup.group,
        },
        resolveQuizGrade,
        getQuizSectionLabel,
      )
    ) {
      return false;
    }

    if (filters.subject !== 'All' && q.subject !== filters.subject) return false;
    if (filters.topic !== 'All' && q.topic !== filters.topic) return false;

    return true;
  });

  result = [...result].sort((a, b) => {
    if (filters.sort === 'title') {
      return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
    }
    const aTime = new Date(a.createdAt ?? 0).getTime();
    const bTime = new Date(b.createdAt ?? 0).getTime();
    return filters.sort === 'oldest' ? aTime - bTime : bTime - aTime;
  });

  return result;
}
