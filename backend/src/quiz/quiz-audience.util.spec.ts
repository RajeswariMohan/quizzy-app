import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';
import {
  isQuizVisibleToStudent,
  normalizeAudienceTargets,
} from './quiz-audience.util';

describe('quiz-audience.util', () => {
  it('normalizes and dedupes audience targets', () => {
    expect(
      normalizeAudienceTargets([
        { grade: 'Class 5', section: 'A' },
        { grade: ' Class 5 ', section: 'A' },
        { grade: '', section: 'B' },
      ]),
    ).toEqual([{ grade: 'Class 5', section: 'A' }]);
  });

  it('shows school-wide quizzes to any student', () => {
    expect(
      isQuizVisibleToStudent(QuizAudienceScope.SCHOOL, [], null, null),
    ).toBe(true);
  });

  it('matches grade and section for targeted quizzes', () => {
    const targets = [{ grade: 'Class 5', section: 'A' }];
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE_SECTION,
        targets,
        'Class 5',
        'A',
      ),
    ).toBe(true);
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE_SECTION,
        targets,
        'Class 5',
        'B',
      ),
    ).toBe(false);
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE_SECTION,
        targets,
        null,
        'A',
      ),
    ).toBe(false);
  });
});
