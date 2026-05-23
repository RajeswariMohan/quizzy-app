import { MockLlmService, MOCK_LLM_MODEL } from './mock-llm.service';
import { parseStructuredLlmOutput } from './llm-output.validator';

describe('MockLlmService', () => {
  const service = new MockLlmService();

  it('returns structured MCQs matching the requested count', async () => {
    const result = await service.generateMcqs({
      prompt: 'Water cycle basics',
      count: 5,
      subject: 'Science',
      topic: 'Water Cycle',
      grade: '6',
      board: 'CBSE',
    });

    expect(result.model).toBe(MOCK_LLM_MODEL);
    expect(result.questions).toHaveLength(5);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    const validated = parseStructuredLlmOutput({ questions: result.questions });
    expect(validated[0].options).toHaveLength(4);
    expect(validated[0].correct_option_index).toBeGreaterThanOrEqual(0);
    expect(validated[0].correct_option_index).toBeLessThanOrEqual(3);
  });
});
