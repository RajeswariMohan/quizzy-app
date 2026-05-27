import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Class } from '@database/entities/class.entity';
import { ParentStudentLink } from '@database/entities/parent-student-link.entity';
import { PlatformSettings } from '@database/entities/platform-settings.entity';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { School } from '@database/entities/school.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { UserFeedback } from '@database/entities/user-feedback.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { buildMinimalBackupBundle } from '../../test/helpers/backup-fixtures';
import {
  FOREIGN_SCHOOL_ID,
  SCHOOL_ID,
  SUPER_ADMIN_ID,
} from '../../test/helpers/constants';
import {
  buildSchoolAdminTenant,
  buildSuperAdminTenant,
} from '../../test/helpers/tenant-fixtures';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { BACKUP_FORMAT_VERSION } from './data-transfer.types';
import { DataTransferService } from './data-transfer.service';

describe('DataTransferService', () => {
  let service: DataTransferService;
  let transaction: jest.Mock;

  const emptyRepo = () => ({
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    createQueryBuilder: jest.fn(() => ({
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    })),
  });

  beforeEach(async () => {
    transaction = jest.fn(async (cb) =>
      cb({
        upsert: jest.fn().mockResolvedValue(undefined),
      }),
    );

    const module = await Test.createTestingModule({
      providers: [
        DataTransferService,
        { provide: DataSource, useValue: { transaction } },
        { provide: getRepositoryToken(School), useValue: emptyRepo() },
        { provide: getRepositoryToken(User), useValue: emptyRepo() },
        { provide: getRepositoryToken(Class), useValue: emptyRepo() },
        { provide: getRepositoryToken(Quiz), useValue: emptyRepo() },
        { provide: getRepositoryToken(Question), useValue: emptyRepo() },
        { provide: getRepositoryToken(ParentStudentLink), useValue: emptyRepo() },
        { provide: getRepositoryToken(StudentResponse), useValue: emptyRepo() },
        { provide: getRepositoryToken(UserFeedback), useValue: emptyRepo() },
        { provide: getRepositoryToken(PlatformSettings), useValue: emptyRepo() },
        {
          provide: TenantContextService,
          useValue: {
            resolveSchoolIdsForQuery: jest.fn(() => [SCHOOL_ID]),
            resolveSchoolIdForQuery: jest.fn(() => SCHOOL_ID),
          },
        },
      ],
    }).compile();

    service = module.get(DataTransferService);
  });

  describe('importForTenant', () => {
    it('rejects unsupported backup format version', async () => {
      const tenant = buildSchoolAdminTenant();
      const raw = buildMinimalBackupBundle({ formatVersion: 99 });

      await expect(service.importForTenant(tenant, raw, true)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects backup with non-array sections', async () => {
      const tenant = buildSchoolAdminTenant();
      const raw = buildMinimalBackupBundle({ users: 'not-an-array' });

      await expect(service.importForTenant(tenant, raw, true)).rejects.toThrow(
        /"users" must be an array/,
      );
    });

    it('dry run returns counts without writing to database', async () => {
      const tenant = buildSchoolAdminTenant();
      const raw = buildMinimalBackupBundle({
        schools: [{ id: SCHOOL_ID, name: 'Test School' }],
        users: [{ id: SUPER_ADMIN_ID, schoolId: SCHOOL_ID, role: UserRole.TEACHER }],
        quizzes: [{ id: 'q1', schoolId: SCHOOL_ID }],
      });

      const result = await service.importForTenant(tenant, raw, true);

      expect(result.dryRun).toBe(true);
      expect(result.imported.schools).toBe(1);
      expect(result.imported.users).toBe(1);
      expect(result.imported.quizzes).toBe(1);
      expect(transaction).not.toHaveBeenCalled();
    });

    it('school admin cannot import data for another school', async () => {
      const tenant = buildSchoolAdminTenant();
      const raw = buildMinimalBackupBundle({
        schools: [{ id: FOREIGN_SCHOOL_ID, name: 'Other School' }],
      });

      await expect(service.importForTenant(tenant, raw, true)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('school admin cannot import super admin users', async () => {
      const tenant = buildSchoolAdminTenant();
      const raw = buildMinimalBackupBundle({
        users: [
          {
            id: SUPER_ADMIN_ID,
            schoolId: SCHOOL_ID,
            role: UserRole.SUPER_ADMIN,
          },
        ],
      });

      await expect(service.importForTenant(tenant, raw, true)).rejects.toThrow(
        /Cannot import super admin/,
      );
    });

    it('school admin cannot import platform settings', async () => {
      const tenant = buildSchoolAdminTenant();
      const raw = buildMinimalBackupBundle({
        platformSettings: { id: '00000000-0000-0000-0000-000000000001' },
      });

      await expect(service.importForTenant(tenant, raw, true)).rejects.toThrow(
        /platform settings/,
      );
    });

    it('super admin can dry-run import with platform settings', async () => {
      const tenant = buildSuperAdminTenant();
      const raw = buildMinimalBackupBundle({
        platformSettings: { id: '00000000-0000-0000-0000-000000000001' },
      });

      const result = await service.importForTenant(tenant, raw, true);

      expect(result.imported.platformSettings).toBe(1);
    });

    it('persists rows on non-dry import', async () => {
      const tenant = buildSchoolAdminTenant();
      const raw = buildMinimalBackupBundle({
        schools: [{ id: SCHOOL_ID, name: 'Test School', createdAt: '2024-01-01T00:00:00.000Z' }],
      });

      const result = await service.importForTenant(tenant, raw, false);

      expect(result.dryRun).toBe(false);
      expect(result.imported.schools).toBe(1);
      expect(transaction).toHaveBeenCalled();
    });
  });

  describe('exportForTenant', () => {
    it('returns bundle with correct format version', async () => {
      const tenant = buildSchoolAdminTenant();
      const bundle = await service.exportForTenant(tenant);

      expect(bundle.formatVersion).toBe(BACKUP_FORMAT_VERSION);
      expect(bundle.scope.schoolIds).toEqual([SCHOOL_ID]);
      expect(Array.isArray(bundle.schools)).toBe(true);
    });

    it('school admin cannot export another school via filter', async () => {
      const tenant = buildSchoolAdminTenant();

      await expect(
        service.exportForTenant(tenant, FOREIGN_SCHOOL_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
