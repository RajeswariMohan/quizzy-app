import { apiClient } from './client';
import type { CreateQuizPayload, QuizSummary } from '@/types/quiz';

export async function createQuiz(payload: CreateQuizPayload): Promise<QuizSummary> {
  const { data } = await apiClient.post<QuizSummary>('/quizzes', payload);
  return data;
}

export async function getQuiz(quizId: string): Promise<QuizSummary & { description?: string }> {
  const { data } = await apiClient.get(`/quizzes/${quizId}`);
  return data;
}
