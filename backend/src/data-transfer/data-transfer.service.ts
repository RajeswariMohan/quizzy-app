import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Class } from '@database/entities/class.entity';
import { ParentStudentLink } from '@database/entities/parent-student-link.entity';
import {
  PlatformSettings,
  PLATFORM_SETTINGS_ROW_ID,
} from '@database/entities/platform-settings.entity';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { School } from '@database/entities/school.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { UserFeedback } from '@database/entities/user-feedback.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import {
  BACKUP_FORMAT_VERSION,
  DataImportResult,
  QuizzyBackupBundle,
} from './data-transfer.types';

@Injectable()
export class DataTransferService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Class)
    private readonly classesRepository: Repository<Class>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(ParentStudentLink)
    private readonly parentLinkRepository: Repository<ParentStudentLink>,
    @InjectRepository(StudentResponse)
    private readonly responseRepository: Repository<StudentResponse>,
    @InjectRepository(UserFeedback)
    private readonly feedbackRepository: Repository<UserFeedback>,
    @InjectRepository(PlatformSettings)
    private readonly platformSettingsRepository: Repository<PlatformSettings>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async exportForTenant(
    tenant: TenantContext,
    schoolIdFilter?: string,
  ): Promise<QuizzyBackupBundle> {
    const schoolIds = this.resolveExportSchoolIds(tenant, schoolIdFilter);
    const includePlatformSettings = tenant.isSuperAdmin && !schoolIdFilter;

    const [
      schools,
      users,
      classes,
      quizzes,
      questions,
      parentStudentLinks,
      studentResponses,
      userFeedback,
      platformSettings,
    ] = await Promise.all([
      this.schoolsRepository.find({ where: { id: In(schoolIds) } }),
      this.loadUsersForExport(schoolIds, tenant),
      this.classesRepository.find({ where: { schoolId: In(schoolIds) } }),
      this.quizRepository.find({ where: { schoolId: In(schoolIds) } }),
      this.questionRepository.find({ where: { schoolId: In(schoolIds) } }),
      this.parentLinkRepository.find({ where: { schoolId: In(schoolIds) } }),
      this.responseRepository.find({ where: { schoolId: In(schoolIds) } }),
      this.feedbackRepository.find({ where: { schoolId: In(schoolIds) } }),
      includePlatformSettings
        ? this.platformSettingsRepository.findOne({
            where: { id: PLATFORM_SETTINGS_ROW_ID },
          })
        : Promise.resolve(null),
    ]);

    return {
      formatVersion: BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      scope: {
        type: tenant.isSuperAdmin && schoolIds.length > 1 ? 'platform' : 'school',
        schoolIds,
      },
      schools: schools.map((row) => this.serializeRow(row)),
      users: users.map((row) => this.serializeRow(row)),
      classes: classes.map((row) => this.serializeRow(row)),
      quizzes: quizzes.map((row) => this.serializeRow(row)),
      questions: questions.map((row) => this.serializeRow(row)),
      parentStudentLinks: parentStudentLinks.map((row) => this.serializeRow(row)),
      studentResponses: studentResponses.map((row) => this.serializeRow(row)),
      userFeedback: userFeedback.map((row) => this.serializeRow(row)),
      platformSettings: platformSettings ? this.serializeRow(platformSettings) : null,
    };
  }

  async importForTenant(
    tenant: TenantContext,
    raw: unknown,
    dryRun = false,
  ): Promise<DataImportResult> {
    const bundle = this.parseBundle(raw);
    const allowedSchoolIds = this.resolveExportSchoolIds(tenant, undefined);
    this.assertBundleInScope(bundle, tenant, allowedSchoolIds);

    const result: DataImportResult = {
      dryRun,
      imported: {
        schools: 0,
        users: 0,
        classes: 0,
        quizzes: 0,
        questions: 0,
        parentStudentLinks: 0,
        studentResponses: 0,
        userFeedback: 0,
        platformSettings: 0,
      },
      warnings: [],
    };

    if (dryRun) {
      result.imported.schools = bundle.schools.length;
      result.imported.users = bundle.users.length;
      result.imported.classes = bundle.classes.length;
      result.imported.quizzes = bundle.quizzes.length;
      result.imported.questions = bundle.questions.length;
      result.imported.parentStudentLinks = bundle.parentStudentLinks.length;
      result.imported.studentResponses = bundle.studentResponses.length;
      result.imported.userFeedback = bundle.userFeedback.length;
      result.imported.platformSettings = bundle.platformSettings ? 1 : 0;
      return result;
    }

    await this.dataSource.transaction(async (manager) => {
      if (bundle.schools.length > 0) {
        const rows = bundle.schools.map((r) => this.normalizeImportRow(r));
        await manager.upsert(School, rows as object[], ['id']);
        result.imported.schools = rows.length;
      }

      if (bundle.users.length > 0) {
        const rows = bundle.users.map((r) => this.normalizeImportRow(r));
        await manager.upsert(User, rows as object[], ['id']);
        result.imported.users = rows.length;
      }

      if (bundle.classes.length > 0) {
        const rows = bundle.classes.map((r) => this.normalizeImportRow(r));
        await manager.upsert(Class, rows as object[], ['id']);
        result.imported.classes = rows.length;
      }

      if (bundle.quizzes.length > 0) {
        const rows = bundle.quizzes.map((r) => this.normalizeImportRow(r));
        await manager.upsert(Quiz, rows as object[], ['id']);
        result.imported.quizzes = rows.length;
      }

      if (bundle.questions.length > 0) {
        const rows = bundle.questions.map((r) => this.normalizeImportRow(r));
        await manager.upsert(Question, rows as object[], ['id']);
        result.imported.questions = rows.length;
      }

      if (bundle.parentStudentLinks.length > 0) {
        const rows = bundle.parentStudentLinks.map((r) => this.normalizeImportRow(r));
        await manager.upsert(ParentStudentLink, rows as object[], ['id']);
        result.imported.parentStudentLinks = rows.length;
      }

      if (bundle.studentResponses.length > 0) {
        const rows = bundle.studentResponses.map((r) => this.normalizeImportRow(r));
        await manager.upsert(StudentResponse, rows as object[], ['id']);
        result.imported.studentResponses = rows.length;
      }

      if (bundle.userFeedback.length > 0) {
        const rows = bundle.userFeedback.map((r) => this.normalizeImportRow(r));
        await manager.upsert(UserFeedback, rows as object[], ['id']);
        result.imported.userFeedback = rows.length;
      }

      if (bundle.platformSettings && tenant.isSuperAdmin) {
        const row = this.normalizeImportRow(bundle.platformSettings);
        await manager.upsert(PlatformSettings, [row as object], ['id']);
        result.imported.platformSettings = 1;
      }
    });

    return result;
  }

  private resolveExportSchoolIds(
    tenant: TenantContext,
    schoolIdFilter?: string,
  ): string[] {
    if (tenant.isSuperAdmin) {
      if (schoolIdFilter) {
        return [schoolIdFilter];
      }
      const ids = this.tenantContextService.resolveSchoolIdsForQuery(tenant);
      if (ids.length > 0) {
        return ids;
      }
      throw new BadRequestException(
        'Select a school in the header filter, or pass schoolId to export a specific school.',
      );
    }

    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    if (!schoolId) {
      throw new ForbiddenException('School context required');
    }
    if (schoolIdFilter && schoolIdFilter !== schoolId) {
      throw new ForbiddenException('Cannot export another school');
    }
    return [schoolId];
  }

  private async loadUsersForExport(
    schoolIds: string[],
    tenant: TenantContext,
  ): Promise<User[]> {
    const qb = this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.school_id IN (:...schoolIds)', { schoolIds });

    if (!tenant.isSuperAdmin) {
      qb.andWhere('u.role != :superAdmin', { superAdmin: UserRole.SUPER_ADMIN });
    }

    return qb.getMany();
  }

  private parseBundle(raw: unknown): QuizzyBackupBundle {
    if (!raw || typeof raw !== 'object') {
      throw new BadRequestException('Invalid backup file: expected JSON object');
    }
    const bundle = raw as QuizzyBackupBundle;
    if (bundle.formatVersion !== BACKUP_FORMAT_VERSION) {
      throw new BadRequestException(
        `Unsupported backup format version: ${bundle.formatVersion}`,
      );
    }
    const arrays = [
      'schools',
      'users',
      'classes',
      'quizzes',
      'questions',
      'parentStudentLinks',
      'studentResponses',
      'userFeedback',
    ] as const;
    for (const key of arrays) {
      if (!Array.isArray(bundle[key])) {
        throw new BadRequestException(`Invalid backup file: "${key}" must be an array`);
      }
    }
    return bundle;
  }

  private assertBundleInScope(
    bundle: QuizzyBackupBundle,
    tenant: TenantContext,
    allowedSchoolIds: string[],
  ): void {
    const allowed = new Set(allowedSchoolIds);

    for (const school of bundle.schools) {
      const id = school.id as string;
      if (!allowed.has(id)) {
        throw new ForbiddenException(`Backup contains school outside your scope: ${id}`);
      }
    }

    const assertSchoolId = (row: Record<string, unknown>, label: string) => {
      const schoolId = row.schoolId as string | null;
      if (schoolId && !allowed.has(schoolId)) {
        throw new ForbiddenException(`${label} row references school outside your scope`);
      }
    };

    for (const user of bundle.users) {
      if (!tenant.isSuperAdmin && user.role === UserRole.SUPER_ADMIN) {
        throw new ForbiddenException('Cannot import super admin users');
      }
      assertSchoolId(user, 'User');
      if (
        !tenant.isSuperAdmin &&
        user.schoolId &&
        !allowed.has(user.schoolId as string)
      ) {
        throw new ForbiddenException('User row references school outside your scope');
      }
    }

    for (const row of bundle.classes) assertSchoolId(row, 'Class');
    for (const row of bundle.quizzes) assertSchoolId(row, 'Quiz');
    for (const row of bundle.questions) assertSchoolId(row, 'Question');
    for (const row of bundle.parentStudentLinks) assertSchoolId(row, 'Parent link');
    for (const row of bundle.studentResponses) assertSchoolId(row, 'Response');
    for (const row of bundle.userFeedback) assertSchoolId(row, 'Feedback');

    if (bundle.platformSettings && !tenant.isSuperAdmin) {
      throw new ForbiddenException('Only super admin can import platform settings');
    }
  }

  private normalizeImportRow(row: Record<string, unknown>): Record<string, unknown> {
    const out = { ...row };
    for (const [key, value] of Object.entries(out)) {
      if (typeof value === 'string' && key.endsWith('At')) {
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) {
          out[key] = new Date(value);
        }
      }
    }
    return out;
  }

  private serializeRow(entity: object): Record<string, unknown> {
    const plain: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(entity)) {
      if (value instanceof Date) {
        plain[key] = value.toISOString();
      } else {
        plain[key] = value;
      }
    }
    return plain;
  }
}
