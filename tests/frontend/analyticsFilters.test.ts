import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_FILTER_ALL,
  applyAnalyticsFilterField,
  buildCreatorLabelByUserId,
  buildCreatorOptionLabels,
  filterCreatorsByQuizzes,
  getLinkedFilterValues,
  mergeAnalyticsFilterOptions,
  resolveCreatorUserId,
  withAllOption,
  type AnalyticsFilterLink,
} from '@/utils/analyticsFilterLinks';
import type { AnalyticsCreatorOption, AnalyticsFilterOptions } from '@/api/dashboard.api';

const links: AnalyticsFilterLink[] = [
  { grade: '8', subject: 'Math', topic: 'Algebra' },
  { grade: '8', subject: 'Science', topic: 'Biology' },
  { grade: '9', subject: 'Math', topic: 'Geometry' },
];

const creators: AnalyticsCreatorOption[] = [
  { userId: 'u1', displayName: 'Ada Teacher', role: 'TEACHER' },
  { userId: 'u2', displayName: 'Bob Admin', role: 'SCHOOL_ADMIN' },
];

const baseOptions: AnalyticsFilterOptions = {
  grades: ['8', '9'],
  subjects: ['Math', 'Science'],
  topics: ['Algebra', 'Biology', 'Geometry'],
  boards: ['CBSE'],
  creators,
  links,
};

describe('analyticsFilterLinks', () => {
  describe('withAllOption', () => {
    it('prepends All to values', () => {
      expect(withAllOption(['A', 'B'])).toEqual(['All', 'A', 'B']);
    });

    it('handles empty list', () => {
      expect(withAllOption([])).toEqual(['All']);
    });
  });

  describe('mergeAnalyticsFilterOptions', () => {
    it('merges school grades and subjects with dashboard options', () => {
      const merged = mergeAnalyticsFilterOptions(baseOptions, ['7'], ['History']);
      expect(merged.grades).toContain('7');
      expect(merged.grades).toContain('8');
      expect(merged.subjects).toContain('History');
      expect(merged.subjects).toContain('Math');
    });
  });

  describe('getLinkedFilterValues', () => {
    it('returns all grades when no filters applied', () => {
      const result = getLinkedFilterValues(links, {}, baseOptions);
      expect(result.grades.sort()).toEqual(['8', '9']);
    });

    it('narrows subjects when grade is selected', () => {
      const result = getLinkedFilterValues(links, { grade: '8' }, baseOptions);
      expect(result.subjects.sort()).toEqual(['Math', 'Science']);
      expect(result.topics.sort()).toEqual(['Algebra', 'Biology']);
    });

    it('falls back to full options when links array is empty', () => {
      const result = getLinkedFilterValues([], { grade: '8' }, baseOptions);
      expect(result.grades).toEqual(baseOptions.grades);
      expect(result.subjects).toEqual(baseOptions.subjects);
    });
  });

  describe('creator helpers', () => {
    it('buildCreatorOptionLabels includes role', () => {
      const labels = buildCreatorOptionLabels(creators);
      expect(labels[0]).toContain('Ada Teacher');
      expect(labels[0]).toContain('Teacher');
    });

    it('resolveCreatorUserId returns undefined for All', () => {
      expect(resolveCreatorUserId(ANALYTICS_FILTER_ALL, creators)).toBeUndefined();
    });

    it('resolveCreatorUserId maps label back to userId', () => {
      const labels = buildCreatorOptionLabels(creators);
      expect(resolveCreatorUserId(labels[0], creators)).toBe('u1');
    });

    it('resolveCreatorUserId returns undefined for unknown label', () => {
      expect(resolveCreatorUserId('Unknown Person', creators)).toBeUndefined();
    });

    it('buildCreatorLabelByUserId maps ids to labels', () => {
      const map = buildCreatorLabelByUserId(creators);
      expect(map.get('u2')).toContain('Bob Admin');
    });

    it('filterCreatorsByQuizzes keeps creators present in quiz list', () => {
      const filtered = filterCreatorsByQuizzes(creators, [
        { createdBy: { userId: 'u1' } },
        { createdBy: { userId: 'u1' } },
      ]);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].userId).toBe('u1');
    });

    it('filterCreatorsByQuizzes returns all when no quiz has createdBy', () => {
      expect(filterCreatorsByQuizzes(creators, [{}, {}])).toHaveLength(2);
    });
  });

  describe('applyAnalyticsFilterField', () => {
    it('clears field when value is All', () => {
      const next = applyAnalyticsFilterField(
        { grade: '8', topic: 'Algebra' },
        'grade',
        ANALYTICS_FILTER_ALL,
        ['Algebra'],
        baseOptions.topics,
        links.length,
      );
      expect(next.grade).toBeUndefined();
      expect(next.topic).toBe('Algebra');
    });

    it('sets grade filter from raw value', () => {
      const next = applyAnalyticsFilterField(
        {},
        'grade',
        '9',
        [],
        baseOptions.topics,
        links.length,
      );
      expect(next.grade).toBe('9');
    });

    it('clears topic when it is not in linked pool after grade change', () => {
      const next = applyAnalyticsFilterField(
        { grade: '8', topic: 'Algebra' },
        'grade',
        '9',
        ['Geometry'],
        baseOptions.topics,
        links.length,
      );
      expect(next.grade).toBe('9');
      expect(next.topic).toBeUndefined();
    });

    it('keeps topic when still valid after subject change', () => {
      const next = applyAnalyticsFilterField(
        { grade: '8', subject: 'Math', topic: 'Algebra' },
        'subject',
        'Math',
        ['Algebra', 'Biology'],
        baseOptions.topics,
        links.length,
      );
      expect(next.topic).toBe('Algebra');
    });
  });
});
