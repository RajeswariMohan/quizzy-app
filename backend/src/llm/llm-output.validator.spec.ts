import { BadRequestException } from '@nestjs/common';
import { parseStructuredLlmOutput } from './llm-output.validator';

describe('parseStructuredLlmOutput', () => {
  it('parses valid structured MCQ payload', () => {
    const result = parseStructuredLlmOutput({
      questions: [
        {
          question_text: 'What is 2+2?',
          options: ['3', '4', '5', '6'],
          correct_option_index: 1,
          explanation: 'Basic arithmetic.',
        },
      ],
    });

    expect(result).toHaveLength(1);
    expect(result[0].correct_option_index).toBe(1);
  });

  it('rejects invalid options length', () => {
    expect(() =>
      parseStructuredLlmOutput({
        questions: [
          {
            question_text: 'Bad',
            options: ['A', 'B'],
            correct_option_index: 0,
            explanation: 'x',
          },
        ],
      }),
    ).toThrow(BadRequestException);
  });
});
