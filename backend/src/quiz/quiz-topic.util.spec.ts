import { hasQuizTopic, normalizeQuizTopic } from './quiz-topic.util';

describe('quiz-topic.util', () => {
  it('normalizeQuizTopic trims and collapses whitespace', () => {
    expect(normalizeQuizTopic('  Photosynthesis  ')).toBe('Photosynthesis');
    expect(normalizeQuizTopic('Cell   Structure')).toBe('Cell Structure');
  });

  it('normalizeQuizTopic returns null for empty input', () => {
    expect(normalizeQuizTopic('')).toBeNull();
    expect(normalizeQuizTopic('   ')).toBeNull();
    expect(normalizeQuizTopic(null)).toBeNull();
    expect(normalizeQuizTopic(undefined)).toBeNull();
  });

  it('hasQuizTopic reflects normalized value', () => {
    expect(hasQuizTopic('Fractions')).toBe(true);
    expect(hasQuizTopic('  ')).toBe(false);
    expect(hasQuizTopic(null)).toBe(false);
  });
});
