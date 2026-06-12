import { describe, expect, it } from 'vitest';
import {
  FILTER_ALL,
  academicGroupFilterModel,
  buildStudentQuizzesQueryParams,
  publishedSectionsGradeSections,
  quizMatchesAcademicGroup,
  resolveFilterSectionValue,
  sectionMatchesFilter,
} from '@/utils/gradeStructure';
import { getQuizSectionLabel, resolveQuizGrade } from '@/utils/quizMeta';
import type { QuizSummary } from '@/types/quiz';

const gradeSections = {
  'Class 8': ['A', 'B'],
  'Class 11': ['Science', 'Commerce', 'Science · A', 'Science · B'],
};

describe('gradeStructure filters', () => {
  it('academicGroupFilterModel returns department_and_section for Class 11', () => {
    const model = academicGroupFilterModel('Class 11', gradeSections);
    expect(model.mode).toBe('department_and_section');
    expect(model.departments).toContain('Science');
    expect(model.sectionLetters).toContain('A');
  });

  it('academicGroupFilterModel returns standard for Class 8', () => {
    const model = academicGroupFilterModel('Class 8', gradeSections);
    expect(model.mode).toBe('standard');
    expect(model.flatOptions).toEqual(['A', 'B']);
  });

  it('resolveFilterSectionValue composes senior composite', () => {
    expect(
      resolveFilterSectionValue({
        grade: 'Class 11',
        gradeSections,
        department: 'Science',
        sectionLetter: 'A',
      }),
    ).toBe('Science · A');
  });

  it('resolveFilterSectionValue returns department only for senior filter', () => {
    expect(
      resolveFilterSectionValue({
        grade: 'Class 11',
        gradeSections,
        department: 'Science',
        sectionLetter: FILTER_ALL,
      }),
    ).toBe('Science');
  });

  it('sectionMatchesFilter matches department prefix', () => {
    expect(sectionMatchesFilter('Science · A', 'Science', 'Class 11')).toBe(true);
    expect(sectionMatchesFilter('Commerce', 'Science', 'Class 11')).toBe(false);
  });

  it('quizMatchesAcademicGroup matches senior department on className', () => {
    const quiz: QuizSummary = {
      id: '1',
      classId: 'c1',
      title: 'Test',
      status: 'DRAFT',
      grade: 'Class 11',
      className: 'Science · A',
    };
    expect(
      quizMatchesAcademicGroup(
        quiz,
        {
          grade: 'Class 11',
          gradeSections,
          department: 'Science',
          sectionLetter: FILTER_ALL,
        },
        resolveQuizGrade,
        getQuizSectionLabel,
      ),
    ).toBe(true);
  });

  it('publishedSectionsGradeSections limits to published sections', () => {
    const result = publishedSectionsGradeSections(
      { 'Class 8': ['A'] },
      'Class 8',
      gradeSections,
    );
    expect(result['Class 8']).toEqual(['A']);
  });

  it('buildStudentQuizzesQueryParams uses class scope when no section selected', () => {
    expect(
      buildStudentQuizzesQueryParams('Class 8', gradeSections, {
        department: FILTER_ALL,
        sectionLetter: FILTER_ALL,
        group: FILTER_ALL,
      }),
    ).toEqual({ grade: 'Class 8', scope: 'class' });
  });
});
