import { apiClient } from './client';
import type { QuizSummary } from '@/types/quiz';

export interface AnalyticsCreatorOption {
  userId: string;
  displayName: string;
  role: string;
}

export interface AnalyticsQueryFilters {
  grade?: string;
  section?: string;
  subject?: string;
  board?: string;
  topic?: string;
  createdByUserId?: string;
}

export interface AnalyticsFilterOptions {
  grades: string[];
  subjects: string[];
  boards: string[];
  topics: string[];
  links?: Array<{
    grade: string;
    subject: string;
    board?: string;
    topic: string;
  }>;
  creators?: AnalyticsCreatorOption[];
}

export interface CreatorPerformanceRow {
  userId: string;
  displayName: string;
  role: string;
  quizCount: number;
  publishedCount: number;
  avgAccuracy: number | null;
}

export interface MasteryPerformanceRow {
  score: number;
  answeredCount: number;
  correctCount: number;
}

export interface SubjectMasteryRow extends MasteryPerformanceRow {
  subject: string;
}

export interface TopicMasteryRow extends MasteryPerformanceRow {
  topic: string;
}

export interface TeacherDashboardData {
  schoolFilter?: {
    schoolCount: number;
    schoolIds: string[];
  };
  filterOptions?: AnalyticsFilterOptions;
  appliedFilters?: {
    grade: string | null;
    section: string | null;
    subject: string | null;
    board: string | null;
    topic: string | null;
    createdByUserId: string | null;
  };
  creatorPerformance?: CreatorPerformanceRow[];
  stats: {
    totalStudents: number;
    quizzesConducted: number;
    avgAccuracy: number;
    topScore: string;
  };
  recentQuizzes: (QuizSummary & {
    className: string | null;
    avgAccuracy: number | null;
    publishedAt?: string | null;
  })[];
  /** Full quiz list for the performance summary table (untruncated). */
  quizSummaryList: (QuizSummary & {
    className: string | null;
    avgAccuracy: number | null;
    publishedAt?: string | null;
  })[];
  topStudents: { rank: number; name: string; score: string }[];
  quizPerformance: { label: string; value: number }[];
  subjectPerformance: SubjectMasteryRow[];
  topicPerformance: TopicMasteryRow[];
}

export async function fetchTeacherDashboard(
  filters: AnalyticsQueryFilters = {},
): Promise<TeacherDashboardData> {
  const params: Record<string, string> = {};
  if (filters.grade) params.grade = filters.grade;
  if (filters.section) params.section = filters.section;
  if (filters.subject) params.subject = filters.subject;
  if (filters.board) params.board = filters.board;
  if (filters.topic) params.topic = filters.topic;
  if (filters.createdByUserId) params.createdByUserId = filters.createdByUserId;

  const { data } = await apiClient.get<TeacherDashboardData>('/quizzes/dashboard/overview', {
    params,
  });
  return data;
}
