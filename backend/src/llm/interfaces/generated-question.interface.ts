export interface GeneratedQuestionPayload {
  question_text: string;
  options: [string, string, string, string];
  correct_option_index: number;
  explanation: string;
}

export interface LlmGenerationRequest {
  prompt: string;
  count: number;
  board?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  sourceText?: string;
}

export interface LlmGenerationResult {
  model: string;
  questions: GeneratedQuestionPayload[];
  latencyMs: number;
}
