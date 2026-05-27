import { apiClient } from './client';
import type { ChartPoint } from '@/types/dashboard';

export interface ProgressStudentsQuery {
  grade?: string;
  section?: string;
  search?: string;
}

export interface StudentProgressRow {
  studentId: string;
  email: string;
  displayName: string;
  grade: string | null;
  section: string | null;
  xpPoints: number;
  currentStreak: number;
  quizzesStarted: number;
  quizzesCompleted: number;
  totalAnswers: number;
  correctAnswers: number;
  accuracy: number;
  totalPointsEarned: number;
  lastActivityAt: string | null;
  totalActiveSeconds: number;
  sessionCount: number;
  lastLoginAt: string | null;
}

export interface StudentProfile {
  studentId: string;
  email: string;
  displayName: string;
  grade: string | null;
  section: string | null;
  xpPoints: number;
  currentStreak: number;
  level: number;
}

export interface StudentOverview {
  student: StudentProfile;
  stats: {
    quizzesStarted: number;
    quizzesCompleted: number;
    totalAnswers: number;
    correctAnswers: number;
    accuracy: number;
    totalPointsEarned: number;
    lastActivityAt: string | null;
  };
  topicMastery: { topic: string; percentage: number }[];
  performanceOverTime: ChartPoint[];
}

export interface QuizProgressRow {
  quizId: string;
  title: string;
  subject: string;
  topic: string;
  board: string;
  grade: string;
  className: string | null;
  questionCount: number;
  answeredCount: number;
  correctCount: number;
  pointsEarned: number;
  accuracy: number;
  isComplete: boolean;
  firstAnsweredAt: string | null;
  lastAnsweredAt: string | null;
  totalTimeSpentSeconds: number | null;
}

export interface QuizProgressDetail {
  student: StudentProfile;
  quiz: {
    id: string;
    title: string;
    subject: string;
    topic: string;
    board: string;
    grade: string;
    className: string | null;
    timeLimitMinutes: number | null;
    questionCount: number;
    publishedAt: string | null;
  };
  summary: {
    answeredCount: number;
    correctCount: number;
    pointsEarned: number;
    accuracy: number;
    isComplete: boolean;
    firstAnsweredAt: string | null;
    lastAnsweredAt: string | null;
    totalTimeSpentSeconds: number | null;
  };
  questions: {
    questionId: string;
    orderIndex: number;
    questionText: string;
    points: number;
    selectedOptionIndex: number | null;
    isCorrect: boolean | null;
    pointsEarned: number;
    answeredAt: string | null;
    timeSpentSeconds: number | null;
  }[];
}

export async function fetchProgressStudents(
  query: ProgressStudentsQuery = {},
): Promise<{ items: StudentProgressRow[]; total: number }> {
  const { data } = await apiClient.get<{ items: StudentProgressRow[]; total: number }>(
    '/progress/students',
    { params: query },
  );
  return data;
}

export async function fetchStudentOverview(studentId: string): Promise<StudentOverview> {
  const { data } = await apiClient.get<StudentOverview>(`/progress/students/${studentId}`);
  return data;
}

export async function fetchStudentQuizzes(
  studentId: string,
): Promise<{ student: StudentProfile; items: QuizProgressRow[] }> {
  const { data } = await apiClient.get<{ student: StudentProfile; items: QuizProgressRow[] }>(
    `/progress/students/${studentId}/quizzes`,
  );
  return data;
}

export async function fetchStudentQuizDetail(
  studentId: string,
  quizId: string,
): Promise<QuizProgressDetail> {
  const { data } = await apiClient.get<QuizProgressDetail>(
    `/progress/students/${studentId}/quizzes/${quizId}`,
  );
  return data;
}
