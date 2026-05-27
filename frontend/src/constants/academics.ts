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
