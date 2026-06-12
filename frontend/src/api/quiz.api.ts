import { apiClient } from './client';
import type {
  CreateQuizPayload,
  PublishQuizPayload,
  QuizStatus,
  QuizSummary,
  UpdateQuizPayload,
} from '@/types/quiz';

export async function createQuiz(payload: CreateQuizPayload): Promise<QuizSummary> {
  const { data } = await apiClient.post<QuizSummary>('/quizzes', payload);
  return data;
}

export async function getQuiz(quizId: string): Promise<QuizSummary & { description?: string }> {
  const { data } = await apiClient.get(`/quizzes/${quizId}`);
  return data;
}

export interface ListQuizzesParams {
  dateFrom?: string;
  dateTo?: string;
  status?: QuizStatus;
}

export async function listQuizzes(params?: ListQuizzesParams): Promise<QuizSummary[]> {
  const { data } = await apiClient.get<QuizSummary[]>('/quizzes', { params });
  return data;
}

export interface QuizTopicSuggestionsParams {
  subject: string;
  grade?: string;
}

export async function fetchQuizTopicSuggestions(
  params: QuizTopicSuggestionsParams,
): Promise<{ topics: string[] }> {
  const { data } = await apiClient.get<{ topics: string[] }>('/quizzes/academic-suggestions', {
    params,
  });
  return data;
}

export async function updateQuiz(
  quizId: string,
  payload: UpdateQuizPayload,
): Promise<QuizSummary & { description?: string | null }> {
  const { data } = await apiClient.patch(`/quizzes/${quizId}`, payload);
  return data;
}

export async function unpublishQuiz(quizId: string): Promise<{
  id: string;
  status: string;
  publishedAt: string | null;
  questionCount: number;
}> {
  const { data } = await apiClient.patch(`/quizzes/${quizId}/unpublish`);
  return data;
}

export async function publishQuiz(
  quizId: string,
  payload: PublishQuizPayload,
): Promise<{
  id: string;
  status: string;
  publishedAt: string;
  questionCount: number;
  audienceScope: string;
  audienceTargets: { grade: string; section: string }[];
}> {
  const { data } = await apiClient.patch(`/quizzes/${quizId}/publish`, payload);
  return data;
}
