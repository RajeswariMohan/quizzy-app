import { apiClient } from './client';
import type {
  AiGeneratePayload,
  AiGenerationAccepted,
  ManualQuestionPayload,
  QuestionItem,
} from '@/types/quiz';

export async function listQuestions(quizId: string): Promise<QuestionItem[]> {
  const { data } = await apiClient.get<QuestionItem[]>(`/quizzes/${quizId}/questions`);
  return data;
}

export async function createManualQuestion(
  quizId: string,
  payload: ManualQuestionPayload,
): Promise<{ id: string; sourceType: string }> {
  const { data } = await apiClient.post(`/quizzes/${quizId}/questions/manual`, payload);
  return data;
}

/** Backend: POST /api/quizzes/:quizId/questions/ai-generate → 202 Accepted */
export async function enqueueAiGeneration(
  quizId: string,
  payload: AiGeneratePayload,
): Promise<AiGenerationAccepted> {
  const { data, status } = await apiClient.post<AiGenerationAccepted>(
    `/quizzes/${quizId}/questions/ai-generate`,
    payload,
  );
  if (status !== 202 && status !== 201) {
    throw new Error(`Unexpected status ${status} from AI generate endpoint`);
  }
  return data;
}
