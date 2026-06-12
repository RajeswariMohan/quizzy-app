import { User } from '@database/entities/user.entity';
import { SelectQueryBuilder } from 'typeorm';
import {
  applyUserSectionFilter,
  isSeniorSecondaryGrade,
} from './academic-section-filter.util';

describe('academic-section-filter.util', () => {
  it('detects Class 11/12 as senior secondary', () => {
    expect(isSeniorSecondaryGrade('Class 11')).toBe(true);
    expect(isSeniorSecondaryGrade('Class 8')).toBe(false);
  });

  it('applyUserSectionFilter uses prefix match for senior department-only', () => {
    const andWhere = jest.fn();
    const qb = { andWhere } as unknown as SelectQueryBuilder<User>;

    applyUserSectionFilter(qb, 'u', 'Science', 'Class 11');

    expect(andWhere).toHaveBeenCalledWith(
      '(u.section = :section OR u.section LIKE :sectionPrefix)',
      { section: 'Science', sectionPrefix: 'Science · %' },
    );
  });

  it('applyUserSectionFilter uses exact match for standard grades', () => {
    const andWhere = jest.fn();
    const qb = { andWhere } as unknown as SelectQueryBuilder<User>;

    applyUserSectionFilter(qb, 'u', 'A', 'Class 8');

    expect(andWhere).toHaveBeenCalledWith('u.section = :section', { section: 'A' });
  });
});
