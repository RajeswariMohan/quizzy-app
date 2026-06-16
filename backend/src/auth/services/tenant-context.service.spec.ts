import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { School } from '@database/entities/school.entity';
import { TenantContextService } from './tenant-context.service';

import { SCHOOL_ID, TEACHER_ID } from '../../../test/helpers/constants';

describe('TenantContextService', () => {
  let service: TenantContextService;
  let findUser: jest.Mock;
  let findSchool: jest.Mock;
  let findSchools: jest.Mock;
  let configGet: jest.Mock;

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
    findUser = jest.fn();
    findSchool = jest.fn().mockResolvedValue(activeSchool);
    findSchools = jest.fn().mockResolvedValue([{ id: SCHOOL_ID }]);
    configGet = jest.fn((key: string) =>
      key === 'DEFAULT_SCHOOL_ID' ? SCHOOL_ID : undefined,
    );

    const module = await Test.createTestingModule({
      providers: [
        TenantContextService,
        {
          provide: getRepositoryToken(User),
          useValue: { findOne: findUser },
        },
        {
          provide: getRepositoryToken(School),
          useValue: { findOne: findSchool, find: findSchools },
        },
        {
          provide: ConfigService,
          useValue: {
            get: configGet,
          },
        },
      ],
    }).compile();

    service = module.get(TenantContextService);
  });

  it('builds tenant context when JWT matches user record', async () => {
    findUser.mockResolvedValue(activeTeacher);

    const context = await service.buildFromPayload({
      sub: TEACHER_ID,
      email: 'teacher@test.school',
      role: UserRole.TEACHER,
      school_id: SCHOOL_ID,
    });

    expect(context.schoolId).toBe(SCHOOL_ID);
    expect(context.actingSchoolId).toBe(SCHOOL_ID);
    expect(context.isTenantScoped).toBe(true);
    expect(context.isSuperAdmin).toBe(false);
  });

  it('rejects mismatched school_id in token', async () => {
    findUser.mockResolvedValue(activeTeacher);

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

  it('resolves school from actingSchoolId or target for super admin', async () => {
    const context = service.toTenantContext(
      '44444444-4444-4444-4444-444444444444',
      'superadmin@quizzy.platform',
      UserRole.SUPER_ADMIN,
      null,
    );

    expect(() => service.resolveSchoolIdForQuery(context)).toThrow(ForbiddenException);

    const withActing = await service.applySuperAdminScope(context, undefined, SCHOOL_ID);
    expect(service.resolveSchoolIdForQuery(withActing)).toBe(SCHOOL_ID);
    expect(service.resolveSchoolIdsForQuery(withActing)).toEqual([SCHOOL_ID]);
    expect(service.resolveSchoolIdForQuery(context, SCHOOL_ID)).toBe(SCHOOL_ID);
  });

  it('applyActingSchool uses X-School-Id header when provided', async () => {
    const context = service.toTenantContext(
      '44444444-4444-4444-4444-444444444444',
      'superadmin@quizzy.platform',
      UserRole.SUPER_ADMIN,
      null,
    );

    const enriched = await service.applySuperAdminScope(context, undefined, SCHOOL_ID);
    expect(enriched.actingSchoolId).toBe(SCHOOL_ID);
    expect(enriched.querySchoolIds).toEqual([SCHOOL_ID]);
  });

  it('applySuperAdminScope accepts X-School-Ids all', async () => {
    const context = service.toTenantContext(
      '44444444-4444-4444-4444-444444444444',
      'superadmin@quizzy.platform',
      UserRole.SUPER_ADMIN,
      null,
    );

    const enriched = await service.applySuperAdminScope(context, 'all');
    expect(enriched.querySchoolIds).toEqual([SCHOOL_ID]);
  });

  it('falls back to active schools when DEFAULT_SCHOOL_ID is stale', async () => {
    configGet.mockImplementation((key: string) =>
      key === 'DEFAULT_SCHOOL_ID' ? '11111111-1111-1111-1111-111111111111' : undefined,
    );
    findSchools
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: '77777777-7777-7777-7777-777777777777' }]);

    const ids = await service.resolveSuperAdminSchoolIds();
    expect(ids).toEqual(['77777777-7777-7777-7777-777777777777']);
  });
});
