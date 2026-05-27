import type { QuizSummary } from '@/types/quiz';
import { formatUserRole } from '@/utils/userRole';

/**
 * Academic level for a quiz (explicit grade field, or derived from linked class).
 * Use this everywhere we label or filter by "Grade" — not the internal class name.
 */
export function resolveQuizGrade(quiz: QuizSummary): string | null {
  if (quiz.grade?.trim()) return quiz.grade.trim();
  const className = quiz.className?.trim();
  if (!className) return null;
  const legacy = className.match(/^(\d+)([A-Za-z])?$/);
  if (legacy) return `Class ${legacy[1]}`;
  if (/^class\s+\d+/i.test(className) || ['Pre-KG', 'LKG', 'UKG'].includes(className)) {
    return className;
  }
  return null;
}

/** @deprecated Use resolveQuizGrade */
export function getQuizGradeLabel(quiz: QuizSummary): string | null {
  return resolveQuizGrade(quiz) ?? quiz.className ?? null;
}

/** Section/homeroom label when it adds detail beyond grade (e.g. "8A"). */
export function getQuizSectionLabel(quiz: QuizSummary): string | null {
  const cn = quiz.className?.trim();
  if (!cn) return null;
  const grade = resolveQuizGrade(quiz);
  if (!grade) return cn;
  if (cn === grade) return null;
  if (cn === `Class ${grade.replace(/^Class\s+/i, '').trim()}`) return null;
  const legacy = cn.match(/^(\d+)([A-Za-z])$/);
  if (legacy && grade === `Class ${legacy[1]}`) return cn;
  if (grade && cn.replace(/\s/g, '').toLowerCase() === grade.replace(/\s/g, '').toLowerCase()) {
    return null;
  }
  return cn;
}

/** Best timestamp for “last activity” on a quiz (publish, edit, or create). */
export function resolveQuizActivityAt(quiz: QuizSummary): string | null {
  if (quiz.status === 'PUBLISHED' && quiz.publishedAt) {
    return quiz.publishedAt;
  }
  if (quiz.updatedAt) {
    return quiz.updatedAt;
  }
  return quiz.createdAt ?? null;
}

export function formatQuizActivityAt(quiz: QuizSummary): string {
  const iso = resolveQuizActivityAt(quiz);
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatQuizCreator(quiz: QuizSummary): string | null {
  const c = quiz.createdBy;
  if (!c) return null;
  return `${c.displayName} (${formatUserRole(c.role)})`;
}

export function formatQuizSubtitle(quiz: QuizSummary): string {
  const gradeLabel = resolveQuizGrade(quiz);
  const sectionLabel = getQuizSectionLabel(quiz);
  const creatorLabel = formatQuizCreator(quiz);
  const parts = [
    quiz.schoolName,
    creatorLabel,
    gradeLabel,
    sectionLabel,
    quiz.board,
    quiz.subject ?? 'General',
    quiz.topic,
  ].filter(Boolean);

  const meta = parts.join(' · ');
  const stats = [
    `${quiz.questionCount ?? 0} questions`,
    quiz.avgAccuracy != null ? `${quiz.avgAccuracy}% avg` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return meta ? `${meta} · ${stats}` : stats;
}
