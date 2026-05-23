export type QuizStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type QuestionSourceType = 'MANUAL' | 'AI_GENERATED';
export type AiGenerationStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface QuizSummary {
  id: string;
  schoolId: string;
  classId: string;
  title: string;
  status: QuizStatus;
  subject?: string | null;
  topic?: string | null;
  questionCount?: number;
  createdAt?: string;
}

export interface QuestionItem {
  id: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string | null;
  orderIndex: number;
  sourceType: QuestionSourceType;
  aiModelUsed?: string | null;
  aiGenerationTaskId?: string | null;
  points: number;
}

export interface CreateQuizPayload {
  classId: string;
  title: string;
  description?: string;
  subject?: string;
  topic?: string;
  board?: string;
  grade?: string;
}

export interface ManualQuestionPayload {
  questionText: string;
  options: [string, string, string, string];
  correctOptionIndex: number;
  explanation?: string;
}

export interface AiGeneratePayload {
  prompt: string;
  count: number;
  board?: string;
  grade?: string;
  subject?: string;
  topic?: string;
  sourceText?: string;
}

export interface AiGenerationAccepted {
  taskId: string;
  status: AiGenerationStatus;
  jobId: string;
  message?: string;
}

export interface AiGenerationTaskStatus {
  taskId: string;
  quizId: string;
  status: AiGenerationStatus;
  requestedCount: number;
  completedCount: number;
  failedCount: number;
  aiModelUsed?: string | null;
  errorMessage?: string | null;
  metrics?: {
    llmLatencyMs?: number;
    questionsPersisted?: number;
  };
}
