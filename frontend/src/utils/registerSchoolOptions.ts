import type { RegisterSchoolOption } from '@/api/registerSchools.api';

/** Unique school names (case-insensitive), preserving first-seen display casing. */
export function uniqueRegisterSchoolNames(schools: RegisterSchoolOption[]): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const school of schools) {
    const key = school.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(school.name);
  }
  return names.sort((a, b) => a.localeCompare(b));
}

/** Boards configured on onboarded schools that share this display name. */
export function boardsForRegisterSchoolName(
  schools: RegisterSchoolOption[],
  schoolName: string,
): string[] {
  const key = schoolName.trim().toLowerCase();
  const boards = new Set<string>();
  for (const school of schools) {
    if (school.name.trim().toLowerCase() !== key) continue;
    const board = school.board?.trim();
    if (board) boards.add(board);
  }
  return [...boards].sort((a, b) => a.localeCompare(b));
}

/** Resolve tenant id from deduped name + board (first match when board omitted). */
export function resolveRegisterSchoolId(
  schools: RegisterSchoolOption[],
  schoolName: string,
  board: string | null,
): string | null {
  const key = schoolName.trim().toLowerCase();
  const matches = schools.filter((s) => s.name.trim().toLowerCase() === key);
  if (matches.length === 0) return null;

  if (board?.trim()) {
    const withBoard = matches.find((s) => s.board?.trim() === board.trim());
    if (withBoard) return withBoard.id;
  }

  if (matches.length === 1) return matches[0].id;
  const withoutBoard = matches.find((s) => !s.board?.trim());
  return withoutBoard?.id ?? matches[0].id;
}
