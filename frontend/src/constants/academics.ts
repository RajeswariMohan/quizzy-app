/** Pre-KG through Class 12 — shared across signup, quizzes, and filters. */
export const GRADES = [
  'Pre-KG',
  'LKG',
  'UKG',
  ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
] as const;

export type Grade = (typeof GRADES)[number];

export const BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB'] as const;

export type Board = (typeof BOARDS)[number];

/** Label for schools with no board configured (admin forms). */
export const BOARD_NOT_SET = 'Not set' as const;

export const BOARD_FILTER_OPTIONS = [BOARD_NOT_SET, ...BOARDS] as const;

/** Dropdown options; preserves legacy board values not in BOARDS. */
export function boardSelectOptions(existingBoard?: string | null): string[] {
  const trimmed = existingBoard?.trim();
  if (!trimmed) return [...BOARD_FILTER_OPTIONS];
  if ((BOARDS as readonly string[]).includes(trimmed)) return [...BOARD_FILTER_OPTIONS];
  return [trimmed, ...BOARD_FILTER_OPTIONS];
}

export function boardFromApiValue(board: string | null | undefined): string {
  const trimmed = board?.trim();
  if (!trimmed) return BOARD_NOT_SET;
  return trimmed;
}

export function boardToApiValue(selected: string): string | null {
  if (!selected || selected === BOARD_NOT_SET) return null;
  return selected;
}

export const SUBJECTS = [
  'Science',
  'Mathematics',
  'English',
  'Social Studies',
  'Hindi',
  'Computer Science',
  'EVS',
  'General Knowledge',
] as const;

export type Subject = (typeof SUBJECTS)[number];

export const DEFAULT_SECTIONS = ['A', 'B', 'C', 'D'] as const;
