import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  DEFAULT_PLATFORM_SETTINGS,
  PLATFORM_SETTINGS_ROW_ID,
  PlatformSettings,
  PlatformSettingsJson,
} from '@database/entities/platform-settings.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { School } from '@database/entities/school.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { UserRole } from '@database/enums/user-role.enum';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateSchoolAdminDto } from './dto/create-school-admin.dto';
import { UpdateSchoolAdminDto } from './dto/update-school-admin.dto';
import { SchoolLimitsService } from '../school/school-limits.service';
import { PasswordService } from '../auth/services/password.service';
import {
  DEFAULT_GRADE_OPTIONS,
  DEFAULT_SECTION_OPTIONS,
  DEFAULT_SUBJECT_OPTIONS,
} from '../common/constants/academics';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settingsRepository: Repository<PlatformSettings>,
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(StudentResponse)
    private readonly responseRepository: Repository<StudentResponse>,
    private readonly schoolLimitsService: SchoolLimitsService,
    private readonly passwordService: PasswordService,
  ) {}

  async getSettings(): Promise<PlatformSettingsJson & { updatedAt: string | null }> {
    const row = await this.ensureSettingsRow();
    return {
      ...row.settings,
      updatedAt: row.updatedAt?.toISOString() ?? null,
    };
  }

  async updateSettings(
    dto: UpdatePlatformSettingsDto,
    updatedByUserId: string,
  ): Promise<PlatformSettingsJson & { updatedAt: string }> {
    const row = await this.ensureSettingsRow();
    row.settings = {
      ...row.settings,
      ...dto,
      maintenanceMessage:
        dto.maintenanceMessage !== undefined
          ? dto.maintenanceMessage
          : row.settings.maintenanceMessage,
    };
    row.updatedByUserId = updatedByUserId;
    const saved = await this.settingsRepository.save(row);
    return {
      ...saved.settings,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  /** Public read-only feature flags for client gating */
  async getPublicFeatures(): Promise<PlatformSettingsJson> {
    const row = await this.ensureSettingsRow();
    return row.settings;
  }

  async getPlatformOverview(
    schoolIds: string[],
    schoolsStatus: 'active' | 'inactive' | 'all' = 'active',
  ) {
    const schools = await this.resolveSchoolsForAdminList(schoolIds, schoolsStatus);

    const schoolStats = await Promise.all(
      schools.map((school) => this.buildSchoolStats(school)),
    );

    const listedTotals = schoolStats.reduce(
      (acc, s) => ({
        students: acc.students + s.students,
        teachers: acc.teachers + s.teachers,
        parents: acc.parents + s.parents,
        publishedQuizzes: acc.publishedQuizzes + s.publishedQuizzes,
      }),
      { students: 0, teachers: 0, parents: 0, publishedQuizzes: 0 },
    );

    const activeSchoolCount = await this.schoolsRepository.count({
      where: { isActive: true },
    });
    const inactiveSchoolCount = await this.schoolsRepository.count({
      where: { isActive: false },
    });

    const activeIds = await this.schoolsRepository.find({
      where: { isActive: true },
      select: ['id'],
    });
    const platformAccuracy = await this.platformAvgAccuracy(
      activeIds.map((s) => s.id),
    );

    const settings = await this.getSettings();

    return {
      settings,
      totals: {
        activeSchools: activeSchoolCount,
        inactiveSchools: inactiveSchoolCount,
        ...listedTotals,
        platformAvgAccuracy: platformAccuracy,
      },
      schools: schoolStats,
      schoolsStatus,
      schoolFilter: {
        schoolCount: schools.length,
        schoolIds: schools.map((s) => s.id),
      },
    };
  }

  private async resolveSchoolsForAdminList(
    scopedActiveSchoolIds: string[],
    status: 'active' | 'inactive' | 'all',
  ): Promise<School[]> {
    if (status === 'inactive') {
      return this.schoolsRepository.find({
        where: { isActive: false },
        order: { name: 'ASC' },
      });
    }

    if (status === 'all') {
      return this.schoolsRepository.find({
        order: { isActive: 'DESC', name: 'ASC' },
      });
    }

    return this.schoolsRepository.find({
      where: { id: In(scopedActiveSchoolIds), isActive: true },
      order: { name: 'ASC' },
    });
  }

  async getSchoolAnalytics(schoolIds: string[]) {
    const overview = await this.getPlatformOverview(schoolIds);
    return {
      schools: overview.schools,
      totals: overview.totals,
    };
  }

  async createSchool(dto: CreateSchoolDto) {
    const slug = dto.slug.trim().toLowerCase();
    const existing = await this.schoolsRepository.findOne({ where: { slug } });
    if (existing) {
      throw new ConflictException('A school with this slug already exists');
    }

    const school = this.schoolsRepository.create({
      name: dto.name.trim(),
      slug,
      board: dto.board?.trim() ?? null,
      primaryColor: dto.primaryColor ?? '#2563EB',
      secondaryColor: dto.secondaryColor ?? '#7C3AED',
      maxStudents: dto.maxStudents ?? null,
      maxTeachers: dto.maxTeachers ?? null,
      maxParents: dto.maxParents ?? null,
      gradeOptions: [...DEFAULT_GRADE_OPTIONS],
      sectionOptions: [...DEFAULT_SECTION_OPTIONS],
      subjectOptions: [...DEFAULT_SUBJECT_OPTIONS],
      isActive: true,
    });

    const saved = await this.schoolsRepository.save(school);

    await this.createSchoolAdmin(saved.id, {
      email: dto.adminEmail,
      password: dto.adminPassword,
      firstName: dto.adminFirstName,
      lastName: dto.adminLastName,
    });

    return this.buildSchoolStats(saved);
  }

  async listSchoolAdmins(schoolId: string) {
    await this.requireSchool(schoolId);
    const admins = await this.usersRepository.find({
      where: { schoolId, role: UserRole.SCHOOL_ADMIN },
      order: { createdAt: 'ASC' },
      select: ['id', 'email', 'firstName', 'lastName', 'isActive', 'createdAt'],
    });
    return admins.map((a) => this.toSchoolAdminRow(a));
  }

  async createSchoolAdmin(schoolId: string, dto: CreateSchoolAdminDto) {
    const school = await this.requireSchool(schoolId);
    if (!school.isActive) {
      throw new ConflictException('Cannot add admins to an inactive school');
    }

    await this.schoolLimitsService.assertCanAddUser(schoolId, UserRole.SCHOOL_ADMIN);

    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersRepository.findOne({ where: { email, schoolId } });
    if (existing) {
      throw new ConflictException('A user with this email already exists at this school');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = this.usersRepository.create({
      email,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      displayName: `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim(),
      role: UserRole.SCHOOL_ADMIN,
      schoolId,
      isActive: true,
    });

    const saved = await this.usersRepository.save(user);
    return this.toSchoolAdminRow(saved);
  }

  async updateSchoolAdmin(schoolId: string, userId: string, dto: UpdateSchoolAdminDto) {
    await this.requireSchool(schoolId);
    const user = await this.usersRepository.findOne({
      where: { id: userId, schoolId, role: UserRole.SCHOOL_ADMIN },
    });
    if (!user) {
      throw new NotFoundException('School admin not found');
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.firstName !== undefined || dto.lastName !== undefined) {
      user.displayName = `${user.firstName} ${user.lastName}`.trim();
    }
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const saved = await this.usersRepository.save(user);
    return this.toSchoolAdminRow(saved);
  }

  private toSchoolAdminRow(user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private async requireSchool(schoolId: string): Promise<School> {
    const school = await this.schoolsRepository.findOne({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    return school;
  }

  async updateSchool(schoolId: string, dto: UpdateSchoolDto) {
    const school = await this.schoolsRepository.findOne({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('School not found');
    }

    if (dto.name !== undefined) school.name = dto.name.trim();
    if (dto.board !== undefined) school.board = dto.board;
    if (dto.primaryColor !== undefined) school.primaryColor = dto.primaryColor;
    if (dto.secondaryColor !== undefined) school.secondaryColor = dto.secondaryColor;
    if (dto.isActive !== undefined) school.isActive = dto.isActive;
    if (dto.maxStudents !== undefined) school.maxStudents = dto.maxStudents;
    if (dto.maxTeachers !== undefined) school.maxTeachers = dto.maxTeachers;
    if (dto.maxParents !== undefined) school.maxParents = dto.maxParents;

    const saved = await this.schoolsRepository.save(school);
    return this.buildSchoolStats(saved);
  }

  private async buildSchoolStats(school: School) {
    const [students, teachers, parents, publishedQuizzes, avgAccuracy] =
      await Promise.all([
        this.usersRepository.count({
          where: {
            schoolId: school.id,
            role: UserRole.STUDENT,
            isActive: true,
          },
        }),
        this.usersRepository.count({
          where: {
            schoolId: school.id,
            role: In([UserRole.TEACHER, UserRole.SCHOOL_ADMIN]),
            isActive: true,
          },
        }),
        this.usersRepository.count({
          where: { schoolId: school.id, role: UserRole.PARENT, isActive: true },
        }),
        this.quizRepository.count({
          where: {
            schoolId: school.id,
            status: QuizStatus.PUBLISHED,
          },
        }),
        this.platformAvgAccuracy([school.id]),
      ]);

    const limits = {
      maxStudents: school.maxStudents,
      maxTeachers: school.maxTeachers,
      maxParents: school.maxParents,
    };

    return {
      id: school.id,
      name: school.name,
      slug: school.slug,
      board: school.board,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
      isActive: school.isActive,
      students,
      teachers,
      parents,
      publishedQuizzes,
      avgAccuracy,
      limits,
      usage: { students, teachers, parents },
    };
  }

  private async platformAvgAccuracy(schoolIds: string[]): Promise<number> {
    if (schoolIds.length === 0) return 0;

    const row = await this.responseRepository
      .createQueryBuilder('r')
      .select(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'avgAccuracy',
      )
      .where('r.school_id IN (:...schoolIds)', { schoolIds })
      .getRawOne<{ avgAccuracy: string | null }>();

    return Number(row?.avgAccuracy ?? 0);
  }

  private async ensureSettingsRow(): Promise<PlatformSettings> {
    let row = await this.settingsRepository.findOne({
      where: { id: PLATFORM_SETTINGS_ROW_ID },
    });

    if (!row) {
      row = this.settingsRepository.create({
        id: PLATFORM_SETTINGS_ROW_ID,
        settings: { ...DEFAULT_PLATFORM_SETTINGS },
      });
      await this.settingsRepository.save(row);
    }

    return row;
  }
}
