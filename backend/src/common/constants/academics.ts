/** Pre-KG through Class 12 — validated on quiz create/update and AI generation. */
export const QUIZ_GRADES = [
  'Pre-KG',
  'LKG',
  'UKG',
  ...Array.from({ length: 12 }, (_, i) => `Class ${i + 1}`),
] as const;

export type QuizGrade = (typeof QUIZ_GRADES)[number];

export const QUIZ_BOARDS = ['CBSE', 'ICSE', 'State Board', 'IB'] as const;

export type QuizBoard = (typeof QUIZ_BOARDS)[number];

export const DEFAULT_SECTION_OPTIONS = ['A', 'B', 'C', 'D'] as const;

export const DEFAULT_GRADE_OPTIONS: readonly string[] = QUIZ_GRADES;

export const DEFAULT_SUBJECT_OPTIONS = [
  'Science',
  'Mathematics',
  'English',
  'Social Studies',
  'Hindi',
  'Computer Science',
  'EVS',
  'General Knowledge',
] as const;
