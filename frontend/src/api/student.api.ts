import { apiClient } from './client';

export interface StudentQuizListItem {
  id: string;
  title: string;
  subject: string | null;
  topic: string | null;
  className: string | null;
  audienceScope: string;
  audienceLabel: string;
  questionCount: number;
  answeredCount: number;
  isComplete: boolean;
}

export interface StudentQuizListResponse {
  filter: { grade: string; section?: string } | null;
  items: StudentQuizListItem[];
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

export interface StudentSubjectPerformance {
  subject: string;
  score: number;
  answeredCount: number;
  correctCount: number;
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
  performanceOverTime: { label: string; value: number }[];
  subjectPerformance: StudentSubjectPerformance[];
}

export interface LeaderboardEntryApi {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  score: number;
  grade: string | null;
  section: string | null;
  isCurrentUser: boolean;
}

export type LeaderboardScopeKey = 'class' | 'section';

export interface StudentAudienceOptions {
  viewer: { grade: string | null; section: string | null };
  grades: string[];
  sectionsByGrade: Record<string, string[]>;
  hasSchoolWidePublished: boolean;
}

export interface StudentAudienceQuery {
  grade?: string;
  scope?: LeaderboardScopeKey;
  section?: string;
}

export interface StudentLeaderboardFilter {
  grade: string;
  scope: LeaderboardScopeKey;
  section: string | null;
  headline: string;
  description: string;
}

export interface StudentLeaderboardResponse {
  viewer: { grade: string | null; section: string | null };
  profileComplete: boolean;
  options: {
    grades: string[];
    sectionsByGrade: Record<string, string[]>;
    hasSchoolWidePublished: boolean;
  };
  filter: StudentLeaderboardFilter | null;
  entries: LeaderboardEntryApi[];
}

export async function fetchStudentAudienceOptions(): Promise<StudentAudienceOptions> {
  const { data } = await apiClient.get<StudentAudienceOptions>('/student/audience-options');
  return data;
}

export async function fetchStudentQuizzes(
  params?: StudentAudienceQuery,
): Promise<StudentQuizListResponse> {
  const { data } = await apiClient.get<StudentQuizListResponse>('/student/quizzes', {
    params,
  });
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

export async function fetchStudentLeaderboard(
  params?: StudentAudienceQuery,
): Promise<StudentLeaderboardResponse> {
  const { data } = await apiClient.get<StudentLeaderboardResponse>('/student/leaderboard', {
    params,
  });
  return data;
}
