import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Quiz } from '@database/entities/quiz.entity';
import { School } from '@database/entities/school.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { UserRole } from '@database/enums/user-role.enum';
import {
  DEFAULT_GRADE_OPTIONS,
  DEFAULT_SECTION_OPTIONS,
  DEFAULT_SUBJECT_OPTIONS,
} from '../common/constants/academics';
import {
  normalizeOptionList,
  SchoolAcademicsService,
} from './school-academics.service';
import { PasswordService } from '../auth/services/password.service';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { SchoolLimitsService } from '../school/school-limits.service';
import { CreateSchoolUserDto } from './dto/create-school-user.dto';
import { UpdateSchoolAcademicsDto } from './dto/update-school-academics.dto';
import { UpdateSchoolUserDto } from './dto/update-school-user.dto';
import { SchoolUserStatusFilter } from './dto/list-school-users-query.dto';

interface ParsedSchoolUser {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  grade: string | null;
  section: string | null;
}

interface BulkImportRowError {
  row: number;
  message: string;
}

@Injectable()
export class SchoolAdminService {
  constructor(
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
    private readonly schoolAcademicsService: SchoolAcademicsService,
  ) {}

  async getAcademicConfigForTenant(tenant: TenantContext) {
    const schoolId = tenant.schoolId ?? tenant.actingSchoolId;
    if (!schoolId) {
      return {
        grades: [...DEFAULT_GRADE_OPTIONS],
        sections: [...DEFAULT_SECTION_OPTIONS],
        subjects: [...DEFAULT_SUBJECT_OPTIONS],
      };
    }
    const school = await this.requireSchool(schoolId);
    return this.schoolAcademicsService.toDto(school);
  }

  async getAcademicConfig(tenant: TenantContext) {
    return this.getAcademicConfigForTenant(tenant);
  }

  async updateAcademicConfig(tenant: TenantContext, dto: UpdateSchoolAcademicsDto) {
    const school = await this.requireSchool(tenant.schoolId);
    const grades = normalizeOptionList(dto.grades);
    const sections = normalizeOptionList(dto.sections);
    const subjects = normalizeOptionList(dto.subjects);

    if (grades.length === 0) {
      throw new BadRequestException('At least one grade is required');
    }
    if (sections.length === 0) {
      throw new BadRequestException('At least one section is required');
    }
    if (subjects.length === 0) {
      throw new BadRequestException('At least one subject is required');
    }

    school.gradeOptions = grades;
    school.sectionOptions = sections;
    school.subjectOptions = subjects;
    await this.schoolsRepository.save(school);

    return { grades, sections, subjects };
  }

  async getOverview(tenant: TenantContext) {
    const schoolId = tenant.schoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }

    const school = await this.requireSchool(schoolId);
    const limits = await this.schoolLimitsService.getLimitsSnapshot(school);
    const publishedQuizzes = await this.quizRepository.count({
      where: { schoolId, status: QuizStatus.PUBLISHED },
    });

    const accuracyRow = await this.responseRepository
      .createQueryBuilder('r')
      .select(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'avgAccuracy',
      )
      .where('r.school_id = :schoolId', { schoolId })
      .getRawOne<{ avgAccuracy: string | null }>();

    return {
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        board: school.board,
      },
      limits,
      publishedQuizzes,
      avgAccuracy: Number(accuracyRow?.avgAccuracy ?? 0),
    };
  }

  async listUsers(
    tenant: TenantContext,
    role?: UserRole,
    status: SchoolUserStatusFilter = SchoolUserStatusFilter.ACTIVE,
  ) {
    const schoolId = tenant.schoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }

    const where: FindOptionsWhere<User> = { schoolId };
    if (role) {
      where.role = role;
    }
    if (status === SchoolUserStatusFilter.ACTIVE) {
      where.isActive = true;
    } else if (status === SchoolUserStatusFilter.INACTIVE) {
      where.isActive = false;
    }

    const users = await this.usersRepository.find({
      where,
      order: { isActive: 'DESC', createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'grade',
        'section',
        'isActive',
        'createdAt',
      ],
    });

    return users.map((u) => this.toUserRow(u));
  }

  async createUser(tenant: TenantContext, dto: CreateSchoolUserDto) {
    const schoolId = tenant.schoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }

    const school = await this.requireSchool(schoolId);
    await this.schoolLimitsService.assertCanAddUser(schoolId, dto.role);

    const parsed = this.parseUserDto(school, dto);
    const existing = await this.usersRepository.findOne({
      where: { email: parsed.email, schoolId },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists at your school');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const user = this.usersRepository.create({
      email: parsed.email,
      passwordHash,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      displayName: `${parsed.firstName} ${parsed.lastName}`.trim(),
      role: parsed.role,
      schoolId,
      grade: parsed.grade,
      section: parsed.section,
      isActive: true,
    });

    const saved = await this.usersRepository.save(user);
    return this.toUserRow(saved);
  }

  async bulkCreateUsers(tenant: TenantContext, dtos: CreateSchoolUserDto[]) {
    const schoolId = tenant.schoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }

    const school = await this.requireSchool(schoolId);
    const errors: BulkImportRowError[] = [];
    const parsedRows: ParsedSchoolUser[] = [];
    const emailsInFile = new Set<string>();

    for (let i = 0; i < dtos.length; i += 1) {
      const row = i + 2;
      try {
        const parsed = this.parseUserDto(school, dtos[i]);
        if (emailsInFile.has(parsed.email)) {
          errors.push({ row, message: `Duplicate email in file: ${parsed.email}` });
          continue;
        }
        emailsInFile.add(parsed.email);
        parsedRows.push(parsed);
      } catch (err) {
        let message = 'Invalid row';
        if (err instanceof BadRequestException) {
          const response = err.getResponse();
          if (typeof response === 'string') {
            message = response;
          } else if (typeof response === 'object' && response !== null && 'message' in response) {
            message = String((response as { message: unknown }).message);
          }
        }
        errors.push({ row, message });
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Bulk import validation failed',
        errors,
      });
    }

    const roleCounts: Record<UserRole.STUDENT | UserRole.TEACHER | UserRole.PARENT, number> = {
      [UserRole.STUDENT]: 0,
      [UserRole.TEACHER]: 0,
      [UserRole.PARENT]: 0,
    };
    for (const row of parsedRows) {
      if (
        row.role === UserRole.STUDENT ||
        row.role === UserRole.TEACHER ||
        row.role === UserRole.PARENT
      ) {
        roleCounts[row.role] += 1;
      }
    }

    await this.assertBatchLimits(schoolId, roleCounts);

    const emails = parsedRows.map((row) => row.email);
    const existing = await this.usersRepository.find({
      where: { schoolId, email: In(emails) },
      select: ['email'],
    });
    if (existing.length > 0) {
      const existingSet = new Set(existing.map((u) => u.email));
      for (let i = 0; i < parsedRows.length; i += 1) {
        if (existingSet.has(parsedRows[i].email)) {
          errors.push({
            row: i + 2,
            message: `Email already exists at your school: ${parsedRows[i].email}`,
          });
        }
      }
      throw new BadRequestException({
        message: 'Bulk import validation failed',
        errors,
      });
    }

    const savedUsers = await this.usersRepository.manager.transaction(async (em) => {
      const usersRepo = em.getRepository(User);
      const created: User[] = [];

      for (let i = 0; i < parsedRows.length; i += 1) {
        const parsed = parsedRows[i];
        const dto = dtos[i];
        const passwordHash = await this.passwordService.hash(dto.password);
        const user = usersRepo.create({
          email: parsed.email,
          passwordHash,
          firstName: parsed.firstName,
          lastName: parsed.lastName,
          displayName: `${parsed.firstName} ${parsed.lastName}`.trim(),
          role: parsed.role,
          schoolId,
          grade: parsed.grade,
          section: parsed.section,
          isActive: true,
        });
        created.push(await usersRepo.save(user));
      }

      return created;
    });

    return {
      importedCount: savedUsers.length,
      users: savedUsers.map((u) => this.toUserRow(u)),
    };
  }

  async updateUser(tenant: TenantContext, userId: string, dto: UpdateSchoolUserDto) {
    const schoolId = tenant.schoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }

    const school = await this.requireSchool(schoolId);
    const user = await this.requireManagedUser(tenant, userId);

    const nextRole = dto.role ?? user.role;
    if (
      nextRole !== UserRole.STUDENT &&
      nextRole !== UserRole.TEACHER &&
      nextRole !== UserRole.PARENT
    ) {
      throw new BadRequestException('Invalid role');
    }

    if (dto.role && dto.role !== user.role) {
      await this.schoolLimitsService.assertCanAddUser(schoolId, dto.role);
    }

    const mergedDto: CreateSchoolUserDto = {
      email: dto.email ?? user.email,
      password: dto.password ?? 'placeholder1',
      firstName: dto.firstName ?? user.firstName,
      lastName: dto.lastName ?? user.lastName,
      role: nextRole,
      grade: nextRole === UserRole.STUDENT ? (dto.grade ?? user.grade ?? undefined) : undefined,
      section:
        nextRole === UserRole.STUDENT ? (dto.section ?? user.section ?? undefined) : undefined,
    };

    const parsed = this.parseUserDto(school, mergedDto);

    if (parsed.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: parsed.email, schoolId },
      });
      if (existing && existing.id !== user.id) {
        throw new ConflictException('A user with this email already exists at your school');
      }
    }

    user.email = parsed.email;
    user.firstName = parsed.firstName;
    user.lastName = parsed.lastName;
    user.displayName = `${parsed.firstName} ${parsed.lastName}`.trim();
    user.role = parsed.role;
    user.grade = parsed.grade;
    user.section = parsed.section;

    if (dto.password) {
      user.passwordHash = await this.passwordService.hash(dto.password);
    }

    const saved = await this.usersRepository.save(user);
    return this.toUserRow(saved);
  }

  async setUserActive(
    tenant: TenantContext,
    userId: string,
    isActive: boolean,
  ): Promise<{ success: true; isActive: boolean }> {
    if (userId === tenant.userId && !isActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    const user = await this.requireManagedUser(tenant, userId);

    if (user.isActive === isActive) {
      return { success: true, isActive: user.isActive };
    }

    if (isActive) {
      await this.schoolLimitsService.assertCanAddUser(user.schoolId!, user.role);
    }

    user.isActive = isActive;
    await this.usersRepository.save(user);
    return { success: true, isActive: user.isActive };
  }

  async deleteUser(tenant: TenantContext, userId: string): Promise<{ success: true }> {
    if (userId === tenant.userId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.requireManagedUser(tenant, userId);

    const quizCount = await this.quizRepository.count({
      where: { createdByUserId: userId, schoolId: user.schoolId! },
    });
    if (quizCount > 0) {
      throw new BadRequestException(
        'This user created quizzes and cannot be removed. Deactivate the account instead.',
      );
    }

    const responseCount = await this.responseRepository.count({
      where: { studentId: userId, schoolId: user.schoolId! },
    });
    if (responseCount > 0) {
      throw new BadRequestException(
        'This user has quiz responses and cannot be removed. Deactivate the account instead.',
      );
    }

    await this.usersRepository.remove(user);
    return { success: true };
  }

  private async requireManagedUser(
    tenant: TenantContext,
    userId: string,
  ): Promise<User> {
    const schoolId = tenant.schoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId, schoolId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.SCHOOL_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('This account cannot be managed here');
    }

    if (
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.TEACHER &&
      user.role !== UserRole.PARENT
    ) {
      throw new ForbiddenException('This account cannot be managed here');
    }

    return user;
  }

  private parseUserDto(school: School, dto: CreateSchoolUserDto): ParsedSchoolUser {
    const email = dto.email.trim().toLowerCase();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();

    if (!firstName || !lastName) {
      throw new BadRequestException('First and last name are required');
    }

    let grade: string | null = null;
    let section: string | null = null;
    if (dto.role === UserRole.STUDENT) {
      const gradeOptions = this.schoolAcademicsService.resolveGradeOptions(school);
      const sectionOptions = this.schoolAcademicsService.resolveSectionOptions(school);
      const selectedGrade = dto.grade?.trim() ?? '';
      const selectedSection = dto.section?.trim() ?? '';

      if (!selectedGrade || !gradeOptions.includes(selectedGrade)) {
        throw new BadRequestException('Select a valid grade for the student');
      }
      if (!selectedSection || !sectionOptions.includes(selectedSection)) {
        throw new BadRequestException('Select a valid section for the student');
      }
      grade = selectedGrade;
      section = selectedSection;
    } else if (dto.grade?.trim() || dto.section?.trim()) {
      throw new BadRequestException('Grade and section are only allowed for students');
    }

    return {
      email,
      firstName,
      lastName,
      role: dto.role,
      grade,
      section,
    };
  }

  private async assertBatchLimits(
    schoolId: string,
    counts: Record<UserRole.STUDENT | UserRole.TEACHER | UserRole.PARENT, number>,
  ): Promise<void> {
    const school = await this.requireSchool(schoolId);
    const usage = await this.schoolLimitsService.getUsage(schoolId);

    if (
      school.maxStudents != null &&
      usage.students + counts[UserRole.STUDENT] > school.maxStudents
    ) {
      throw new BadRequestException(
        `Import would exceed student limit (${school.maxStudents}). ${usage.students} already enrolled, importing ${counts[UserRole.STUDENT]} more.`,
      );
    }

    if (
      school.maxTeachers != null &&
      usage.teachers + counts[UserRole.TEACHER] > school.maxTeachers
    ) {
      throw new BadRequestException(
        `Import would exceed teacher limit (${school.maxTeachers}). ${usage.teachers} already onboarded, importing ${counts[UserRole.TEACHER]} more.`,
      );
    }

    if (school.maxParents != null && usage.parents + counts[UserRole.PARENT] > school.maxParents) {
      throw new BadRequestException(
        `Import would exceed parent limit (${school.maxParents}). ${usage.parents} already onboarded, importing ${counts[UserRole.PARENT]} more.`,
      );
    }
  }

  private async requireSchool(schoolId: string | null | undefined): Promise<School> {
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }
    const school = await this.schoolsRepository.findOne({ where: { id: schoolId } });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    return school;
  }

  private toUserRow(u: User) {
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      grade: u.grade,
      section: u.section,
      isActive: u.isActive,
      createdAt: u.createdAt.toISOString(),
    };
  }
}
