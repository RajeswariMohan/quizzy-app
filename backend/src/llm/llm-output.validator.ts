import { BadRequestException } from '@nestjs/common';
import { GeneratedQuestionPayload } from './interfaces/generated-question.interface';

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseGeneratedQuestion(raw: unknown, index: number): GeneratedQuestionPayload {
  if (!raw || typeof raw !== 'object') {
    throw new BadRequestException(`Question ${index + 1}: expected an object`);
  }

  const item = raw as Record<string, unknown>;

  if (!isNonEmptyString(item.question_text)) {
    throw new BadRequestException(`Question ${index + 1}: question_text is required`);
  }

  if (!Array.isArray(item.options) || item.options.length !== 4) {
    throw new BadRequestException(`Question ${index + 1}: options must be an array of 4 strings`);
  }

  const options = item.options.map((opt, optIndex) => {
    if (!isNonEmptyString(opt)) {
      throw new BadRequestException(
        `Question ${index + 1}: option ${optIndex + 1} must be a non-empty string`,
      );
    }
    return opt.trim();
  }) as [string, string, string, string];

  const correctIndex = item.correct_option_index;
  if (
    typeof correctIndex !== 'number' ||
    !Number.isInteger(correctIndex) ||
    correctIndex < 0 ||
    correctIndex > 3
  ) {
    throw new BadRequestException(
      `Question ${index + 1}: correct_option_index must be an integer 0–3`,
    );
  }

  if (!isNonEmptyString(item.explanation)) {
    throw new BadRequestException(`Question ${index + 1}: explanation is required`);
  }

  return {
    question_text: item.question_text.trim(),
    options,
    correct_option_index: correctIndex,
    explanation: item.explanation.trim(),
  };
}

export function parseStructuredLlmOutput(raw: unknown): GeneratedQuestionPayload[] {
  if (!raw || typeof raw !== 'object') {
    throw new BadRequestException('LLM output must be a JSON object');
  }

  const root = raw as Record<string, unknown>;
  const questionsRaw = root.questions;

  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) {
    throw new BadRequestException('LLM output must include a non-empty questions array');
  }

  return questionsRaw.map((q, index) => parseGeneratedQuestion(q, index));
}
