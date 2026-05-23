import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { School } from '@database/entities/school.entity';
import { TenantContextService } from './tenant-context.service';

import { SCHOOL_ID, TEACHER_ID } from '../../../test/helpers/constants';

describe('TenantContextService', () => {
  let service: TenantContextService;
  let findOne: jest.Mock;

  const activeSchool: Partial<School> = {
    id: SCHOOL_ID,
    isActive: true,
  };

  const activeTeacher: Partial<User> = {
    id: TEACHER_ID,
    email: 'teacher@test.school',
    role: UserRole.TEACHER,
    schoolId: SCHOOL_ID,
    isActive: true,
    school: activeSchool as School,
  };

  beforeEach(async () => {
    findOne = jest.fn();

    const module = await Test.createTestingModule({
      providers: [
        TenantContextService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOne },
        },
      ],
    }).compile();

    service = module.get(TenantContextService);
  });

  it('builds tenant context when JWT matches user record', async () => {
    findOne.mockResolvedValue(activeTeacher);

    const context = await service.buildFromPayload({
      sub: TEACHER_ID,
      email: 'teacher@test.school',
      role: UserRole.TEACHER,
      school_id: SCHOOL_ID,
    });

    expect(context.schoolId).toBe(SCHOOL_ID);
    expect(context.isTenantScoped).toBe(true);
    expect(context.isSuperAdmin).toBe(false);
  });

  it('rejects mismatched school_id in token', async () => {
    findOne.mockResolvedValue(activeTeacher);

    await expect(
      service.buildFromPayload({
        sub: TEACHER_ID,
        email: 'teacher@test.school',
        role: UserRole.TEACHER,
        school_id: '99999999-9999-9999-9999-999999999999',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects super admin token with school_id', () => {
    expect(() =>
      service.toTenantContext(
        '44444444-4444-4444-4444-444444444444',
        'superadmin@quizzy.platform',
        UserRole.SUPER_ADMIN,
        SCHOOL_ID,
      ),
    ).toThrow(UnauthorizedException);
  });

  it('blocks cross-tenant access for teachers', () => {
    const context = service.toTenantContext(
      TEACHER_ID,
      'teacher@test.school',
      UserRole.TEACHER,
      SCHOOL_ID,
    );

    expect(() =>
      service.assertCanAccessSchool(context, '99999999-9999-9999-9999-999999999999'),
    ).toThrow(ForbiddenException);
  });

  it('requires explicit school_id for super admin queries', () => {
    const context = service.toTenantContext(
      '44444444-4444-4444-4444-444444444444',
      'superadmin@quizzy.platform',
      UserRole.SUPER_ADMIN,
      null,
    );

    expect(() => service.resolveSchoolIdForQuery(context)).toThrow(ForbiddenException);
    expect(service.resolveSchoolIdForQuery(context, SCHOOL_ID)).toBe(SCHOOL_ID);
  });
});
