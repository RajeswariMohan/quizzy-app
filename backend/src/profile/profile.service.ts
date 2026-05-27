import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '@database/entities/school.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { PasswordService } from '../auth/services/password.service';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { SchoolAcademicsService } from '../school-admin/school-academics.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface ProfileResponse {
  userId: string;
  email: string;
  role: UserRole;
  schoolId: string | null;
  actingSchoolId: string | null;
  isTenantScoped: boolean;
  firstName: string;
  lastName: string;
  displayName: string;
  avatarUrl: string | null;
  grade: string | null;
  section: string | null;
  xpPoints: number;
  currentStreak: number;
  schoolName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  createdAt: string;
  updatedAt: string;
  academicOptions: { grades: string[]; sections: string[] } | null;
  /** True when the user must set a password (dev seed / no password login yet). */
  requiresPasswordSetup: boolean;
}

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    private readonly passwordService: PasswordService,
    private readonly schoolAcademicsService: SchoolAcademicsService,
  ) {}

  async getProfile(tenant: TenantContext): Promise<ProfileResponse> {
    const user = await this.loadUserWithPasswordFlag(tenant.userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toProfileResponse(user, tenant);
  }

  private async loadUserWithPasswordFlag(userId: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.school', 'school')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id: userId })
      .getOne();
  }

  async updateProfile(
    tenant: TenantContext,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponse> {
    const user = await this.usersRepository.findOne({
      where: { id: tenant.userId },
      relations: ['school'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (dto.firstName !== undefined) user.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) user.lastName = dto.lastName.trim();
    if (dto.displayName !== undefined) {
      user.displayName = dto.displayName.trim() || null;
    }
    if (dto.avatarUrl !== undefined) {
      const url = dto.avatarUrl.trim();
      if (url && !/^https?:\/\/.+/i.test(url)) {
        throw new BadRequestException('avatarUrl must start with http:// or https://');
      }
      user.avatarUrl = url || null;
    }

    if (dto.grade !== undefined || dto.section !== undefined) {
      if (user.role !== UserRole.STUDENT) {
        throw new ForbiddenException('Only students can update grade and section');
      }
      const school = await this.resolveSchoolForUser(user, tenant);
      if (dto.grade !== undefined) {
        const grade = dto.grade.trim();
        if (grade) {
          this.assertGradeAllowed(school, grade);
        }
        user.grade = grade || null;
      }
      if (dto.section !== undefined) {
        const section = dto.section.trim();
        if (section) {
          this.assertSectionAllowed(school, section);
        }
        user.section = section || null;
      }
    }

    await this.usersRepository.save(user);
    const refreshed = await this.loadUserWithPasswordFlag(tenant.userId);
    return this.toProfileResponse(refreshed!, tenant);
  }

  async changePassword(
    tenant: TenantContext,
    dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    const user = await this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.id = :id', { id: tenant.userId })
      .getOne();

    if (!user?.passwordHash) {
      throw new NotFoundException('User not found');
    }

    const needsSetup = this.passwordService.isUnsetOrPlaceholder(user.passwordHash);

    if (!needsSetup) {
      const current = dto.currentPassword?.trim() ?? '';
      if (!current) {
        throw new BadRequestException('Current password is required');
      }
      const valid = await this.passwordService.verify(current, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedException('Current password is incorrect');
      }
      if (current === dto.newPassword) {
        throw new BadRequestException(
          'New password must be different from the current password',
        );
      }
    }

    user.passwordHash = await this.passwordService.hash(dto.newPassword);
    await this.usersRepository.save(user);
    return { success: true };
  }

  private async toProfileResponse(
    user: User,
    tenant: TenantContext,
  ): Promise<ProfileResponse> {
    let school = user.school ?? null;
    if (tenant.isSuperAdmin && tenant.actingSchoolId) {
      school =
        (await this.schoolsRepository.findOne({
          where: { id: tenant.actingSchoolId, isActive: true },
        })) ?? school;
    }

    const academicOptions =
      user.role === UserRole.STUDENT && school
        ? {
            grades: this.schoolAcademicsService.resolveGradeOptions(school),
            sections: this.schoolAcademicsService.resolveSectionOptions(school),
          }
        : null;

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      actingSchoolId: tenant.actingSchoolId,
      isTenantScoped: tenant.isTenantScoped,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName ?? `${user.firstName} ${user.lastName}`.trim(),
      avatarUrl: user.avatarUrl,
      grade: user.grade,
      section: user.section,
      xpPoints: user.xpPoints,
      currentStreak: user.currentStreak,
      schoolName: school?.name ?? null,
      primaryColor: school?.primaryColor ?? null,
      secondaryColor: school?.secondaryColor ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      academicOptions,
      requiresPasswordSetup:
        user.passwordHash !== undefined &&
        this.passwordService.isUnsetOrPlaceholder(user.passwordHash),
    };
  }

  private async resolveSchoolForUser(user: User, tenant: TenantContext): Promise<School> {
    const schoolId = user.schoolId ?? tenant.actingSchoolId;
    if (!schoolId) {
      throw new BadRequestException('No school linked to your account');
    }
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId, isActive: true },
    });
    if (!school) {
      throw new BadRequestException('School not found');
    }
    return school;
  }

  private normalizeOptions(values: string[] | null | undefined): string[] {
    return [...new Set((values ?? []).map((v) => v?.trim()).filter(Boolean) as string[])].sort(
      (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }),
    );
  }

  private assertGradeAllowed(school: School, grade: string): void {
    this.schoolAcademicsService.assertGradeAllowed(school, grade);
  }

  private assertSectionAllowed(school: School, section: string): void {
    this.schoolAcademicsService.assertSectionAllowed(school, section);
  }
}
