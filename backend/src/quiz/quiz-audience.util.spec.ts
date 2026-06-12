import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';
import {
  isQuizVisibleToStudent,
  normalizeAudienceTargets,
  quizMatchesPublishedAudienceFilter,
  sectionMatchesAudienceTarget,
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

  it('matches senior secondary section composites and department prefixes', () => {
    const targets = [{ grade: 'Class 11', section: 'Science · A' }];
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE_SECTION,
        targets,
        'Class 11',
        'Science · A',
      ),
    ).toBe(true);
    expect(
      sectionMatchesAudienceTarget('Science · A', 'Science', 'Class 11'),
    ).toBe(true);
    const deptTarget = [{ grade: 'Class 11', section: 'Science' }];
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE_SECTION,
        deptTarget,
        'Class 11',
        'Science · A',
      ),
    ).toBe(true);
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE_SECTION,
        targets,
        'Class 11',
        'Science',
      ),
    ).toBe(false);
  });

  it('filters quizzes by published grade and section', () => {
    const targets = [{ grade: 'Class 7', section: 'A' }];
    expect(
      quizMatchesPublishedAudienceFilter(
        QuizAudienceScope.GRADE_SECTION,
        targets,
        { grade: 'Class 7', section: 'A' },
      ),
    ).toBe(true);
    expect(
      quizMatchesPublishedAudienceFilter(
        QuizAudienceScope.GRADE_SECTION,
        targets,
        { grade: 'Class 7' },
      ),
    ).toBe(true);
    expect(
      quizMatchesPublishedAudienceFilter(
        QuizAudienceScope.GRADE_SECTION,
        targets,
        { grade: 'Class 7', section: 'B' },
      ),
    ).toBe(false);
  });

  it('matches grade-only scope to any section in that grade', () => {
    const targets = [{ grade: 'Class 5' }];
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE,
        targets,
        'Class 5',
        'A',
      ),
    ).toBe(true);
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE,
        targets,
        'Class 5',
        'Tulip',
      ),
    ).toBe(true);
    expect(
      isQuizVisibleToStudent(
        QuizAudienceScope.GRADE,
        targets,
        'Class 6',
        'A',
      ),
    ).toBe(false);
  });
});
