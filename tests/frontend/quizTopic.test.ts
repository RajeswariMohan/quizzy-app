import { describe, expect, it } from 'vitest';
import {
  hasQuizTopic,
  normalizeQuizTopicForApi,
  normalizeQuizTopicInput,
} from '@/utils/quizTopic';

describe('quizTopic', () => {
  it('normalizeQuizTopicInput trims and collapses whitespace', () => {
    expect(normalizeQuizTopicInput('  Algebra  ')).toBe('Algebra');
    expect(normalizeQuizTopicInput('World   War')).toBe('World War');
  });

  it('normalizeQuizTopicForApi omits empty values', () => {
    expect(normalizeQuizTopicForApi('Biology')).toBe('Biology');
    expect(normalizeQuizTopicForApi('   ')).toBeUndefined();
  });

  it('hasQuizTopic detects non-empty topics', () => {
    expect(hasQuizTopic('Trees')).toBe(true);
    expect(hasQuizTopic('')).toBe(false);
  });
});
