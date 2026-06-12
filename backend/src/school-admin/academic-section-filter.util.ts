import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

const SENIOR_SECONDARY_PATTERN =
  /class\s*(11|xi{1,2}|12|xii)\b|grade\s*(11|12)\b|\b11th\b|\b12th\b|\bxi\b|\bxii\b|std\.?\s*(11|12|xi{1,2}|xii)/i;

const SENIOR_COMPOSITE_SEP = ' · ';

export function isSeniorSecondaryGrade(grade: string | null | undefined): boolean {
  if (!grade?.trim()) return false;
  return SENIOR_SECONDARY_PATTERN.test(grade.trim());
}

/**
 * Filter user.section — for Class 11/12 department-only filters, match exact or "Dept · *".
 */
export function applyUserSectionFilter(
  qb: SelectQueryBuilder<ObjectLiteral>,
  userAlias: string,
  section: string,
  grade?: string | null,
): void {
  const trimmed = section.trim();
  if (!trimmed) return;

  const column = `${userAlias}.section`;
  if (isSeniorSecondaryGrade(grade) && !trimmed.includes(SENIOR_COMPOSITE_SEP)) {
    qb.andWhere(`(${column} = :section OR ${column} LIKE :sectionPrefix)`, {
      section: trimmed,
      sectionPrefix: `${trimmed}${SENIOR_COMPOSITE_SEP}%`,
    });
    return;
  }

  qb.andWhere(`${column} = :section`, { section: trimmed });
}
