import { Injectable } from '@nestjs/common';
import {
  GeneratedQuestionPayload,
  LlmGenerationRequest,
  LlmGenerationResult,
} from './interfaces/generated-question.interface';
import { parseStructuredLlmOutput } from './llm-output.validator';

export const MOCK_LLM_MODEL = 'quizzy-mock-structured-v1';

@Injectable()
export class MockLlmService {
  /**
   * Simulates an external LLM returning controlled structured JSON for MCQs.
   */
  async generateMcqs(request: LlmGenerationRequest): Promise<LlmGenerationResult> {
    const started = Date.now();
    await this.simulateNetworkLatency();

    const rawPayload = this.buildMockPayload(request);
    const questions = parseStructuredLlmOutput(rawPayload);

    return {
      model: MOCK_LLM_MODEL,
      questions: questions.slice(0, request.count),
      latencyMs: Date.now() - started,
    };
  }

  private async simulateNetworkLatency(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  private buildMockPayload(request: LlmGenerationRequest): {
    questions: GeneratedQuestionPayload[];
  } {
    const topicLabel = request.topic ?? request.subject ?? 'General Knowledge';
    const gradeLabel = request.grade ?? 'all grades';
    const boardLabel = request.board ?? 'general board';

    const questions: GeneratedQuestionPayload[] = Array.from(
      { length: request.count },
      (_, index) => {
        const n = index + 1;
        return {
          question_text: `${request.prompt.trim()} (Mock Q${n} — ${topicLabel}, ${gradeLabel}, ${boardLabel})`,
          options: [
            `Option A for question ${n}`,
            `Option B for question ${n}`,
            `Option C for question ${n}`,
            `Option D for question ${n}`,
          ],
          correct_option_index: index % 4,
          explanation: `Mock explanation for question ${n} generated from structured output.`,
        };
      },
    );

    return { questions };
  }
}
