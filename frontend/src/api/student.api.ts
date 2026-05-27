import { apiClient } from './client';

export interface StudentQuizListItem {
  id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  className: string | null;
  questionCount: number;
  answeredCount: number;
  isComplete: boolean;
}

export interface StudentQuizPriorAnswer {
  isCorrect: boolean;
  pointsEarned: number;
  correctOptionIndex: number;
  explanation: string | null;
}

export interface StudentQuizQuestion {
  id: string;
  questionText: string;
  options: string[];
  orderIndex: number;
  points: number;
  selectedOptionIndex: number | null;
  priorAnswer: StudentQuizPriorAnswer | null;
}

export interface StudentQuizDetail {
  id: string;
  title: string;
  description: string | null;
  subject: string | null;
  topic: string | null;
  timeLimitMinutes: number | null;
  questions: StudentQuizQuestion[];
}

export interface SubmitResponseResult {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  correctOptionIndex: number;
  explanation: string | null;
}

export interface StudentProgress {
  displayName: string;
  xpPoints: number;
  currentStreak: number;
  level: number;
  xpInLevel: number;
  xpToNextLevel: number;
  quizzesTaken: number;
  accuracy: number;
  totalAnswers: number;
  topicMastery: { topic: string; percentage: number }[];
  performanceOverTime: { label: string; value: number }[];
}

export interface LeaderboardEntryApi {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  score: number;
  isCurrentUser: boolean;
}

export async function fetchStudentQuizzes(): Promise<StudentQuizListItem[]> {
  const { data } = await apiClient.get<StudentQuizListItem[]>('/student/quizzes');
  return data;
}

export async function fetchStudentQuiz(quizId: string): Promise<StudentQuizDetail> {
  const { data } = await apiClient.get<StudentQuizDetail>(`/student/quizzes/${quizId}`);
  return data;
}

export async function submitStudentResponse(
  quizId: string,
  payload: { questionId: string; selectedOptionIndex: number },
): Promise<SubmitResponseResult> {
  const { data } = await apiClient.post<SubmitResponseResult>(
    `/student/quizzes/${quizId}/responses`,
    payload,
  );
  return data;
}

export async function fetchStudentProgress(): Promise<StudentProgress> {
  const { data } = await apiClient.get<StudentProgress>('/student/progress');
  return data;
}

export async function fetchStudentLeaderboard(): Promise<LeaderboardEntryApi[]> {
  const { data } = await apiClient.get<LeaderboardEntryApi[]>('/student/leaderboard');
  return data;
}
