import { apiClient } from './client';
import type { AiGenerationTaskStatus } from '@/types/quiz';

export async function getAiGenerationTask(taskId: string): Promise<AiGenerationTaskStatus> {
  const { data } = await apiClient.get<AiGenerationTaskStatus>(`/ai-generation-tasks/${taskId}`);
  return data;
}
