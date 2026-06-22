import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { School } from '@database/entities/school.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { ParentStudentLinkService } from '../parent/parent-student-link.service';
import { SchoolLimitsService } from '../school/school-limits.service';
import { Public } from './decorators/public.decorator';
import { DEV_SEED_USER_IDS, resolveDevSeedRole } from './constants/dev-seed-users';
import {
  assertValidUsername,
  buildStudentLoginEmail,
} from './constants/username.util';
import {
  UNLISTED_SCHOOL_ID,
  UNLISTED_SCHOOL_SLUG,
} from './constants/unlisted-school';
import { DevIssueTokenDto } from './dto/dev-issue-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService, AuthTokensResponse, RegisterPendingResponse } from './auth.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { SchoolAcademicsService } from '../school-admin/school-academics.service';
import { SchoolFeatureService } from '../school/school-feature.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordService: PasswordService,
    private readonly configService: ConfigService,
    private readonly schoolAcademicsService: SchoolAcademicsService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    private readonly parentStudentLinkService: ParentStudentLinkService,
    private readonly schoolLimitsService: SchoolLimitsService,
    private readonly schoolFeatureService: SchoolFeatureService,
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthTokensResponse> {
    const identifier = dto.identifier.trim().toLowerCase();

    const pendingQb = this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.signup_pending_at IS NOT NULL')
      .andWhere('u.is_active = false');

    if (identifier.includes('@')) {
      pendingQb.andWhere('LOWER(u.email) = :identifier', { identifier });
    } else {
      pendingQb.andWhere('LOWER(u.username) = :identifier', { identifier });
    }

    const pendingMatches = await pendingQb.getMany();
    if (pendingMatches.length === 1) {
      const valid = await this.passwordService.verify(
        dto.password,
        pendingMatches[0].passwordHash,
      );
      if (valid) {
        throw new UnauthorizedException(
          'Your account is awaiting approval from your school. You will be able to sign in once approved.',
        );
      }
    }

    const qb = this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.is_active = true');

    if (identifier.includes('@')) {
      qb.andWhere('LOWER(u.email) = :identifier', { identifier });
    } else {
      qb.andWhere('LOWER(u.username) = :identifier', { identifier });
    }

    const matches = await qb.getMany();
    if (matches.length === 0) {
      throw new UnauthorizedException('Invalid username/email or password');
    }
    if (matches.length > 1) {
      throw new UnauthorizedException(
        'Multiple accounts match this username. Sign in with your email address instead.',
      );
    }

    const user = matches[0];
    const valid = await this.passwordService.verify(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid username/email or password');
    }

    return this.authService.issueTokensForUser(user.id, this.sessionMetaFromRequest(req));
  }

  /** Check student username availability within a school (public signup). */
  @Public()
  @Get('register/check-username')
  async checkUsername(
    @Query('schoolId') schoolId: string,
    @Query('username') username: string,
  ) {
    const targetSchoolId = schoolId?.trim();
    if (!targetSchoolId) {
      throw new BadRequestException('schoolId is required');
    }
    try {
      const normalized = assertValidUsername(username ?? '');
      const taken = await this.usersRepository
        .createQueryBuilder('u')
        .where('u.school_id = :schoolId', { schoolId: targetSchoolId })
        .andWhere('LOWER(u.username) = :username', { username: normalized })
        .getOne();
      return { available: !taken, username: normalized };
    } catch (err) {
      if (err instanceof BadRequestException) {
        return { available: false, reason: err.message };
      }
      throw err;
    }
  }

  /** Resolve a single onboarded school by slug (school join link). */
  @Public()
  @Get('register-school/:slug')
  async registerSchoolBySlug(@Param('slug') slug: string) {
    const normalized = slug.trim().toLowerCase();
    if (!normalized || normalized === UNLISTED_SCHOOL_SLUG) {
      throw new NotFoundException('School not found');
    }
    const school = await this.schoolsRepository.findOne({
      where: { slug: normalized, isActive: true },
      select: ['id', 'name', 'board', 'slug'],
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    return {
      id: school.id,
      name: school.name,
      board: school.board,
      slug: school.slug,
    };
  }

  /** Active onboarded schools for self-service signup (excludes unlisted tenant). */
  @Public()
  @Get('register-schools')
  async registerSchools() {
    const schools = await this.schoolsRepository.find({
      where: { isActive: true, slug: Not(UNLISTED_SCHOOL_SLUG) },
      select: ['id', 'name', 'board'],
      order: { name: 'ASC' },
    });

    return {
      schools: schools.map((school) => ({
        id: school.id,
        name: school.name,
        board: school.board,
      })),
      otherSchoolId: this.resolveUnlistedSchoolId(),
    };
  }

  /** Academic options for self-service signup (default or requested school). */
  @Public()
  @Get('register-academics')
  async registerAcademics(@Query('schoolId') schoolId?: string) {
    const target =
      schoolId?.trim() ||
      this.configService.get<string>('DEFAULT_SCHOOL_ID')?.trim() ||
      null;
    if (!target) {
      throw new BadRequestException('schoolId is required');
    }
    const academics = await this.schoolAcademicsService.getForSchoolId(target);
    const features = await this.schoolFeatureService.getEffectiveFeatures(target);
    return {
      ...academics,
      parentPortalEnabled: features.parentPortalEnabled,
    };
  }

  @Public()
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
  ): Promise<AuthTokensResponse | RegisterPendingResponse> {
    this.validateRegisterFields(dto);

    const schoolId = await this.resolveSchoolId(dto.schoolId, dto.role);
    const school =
      schoolId !== null
        ? await this.schoolsRepository.findOne({
            where: { id: schoolId, isActive: true },
          })
        : null;

    const signupFlow = this.resolveSignupFlow(dto, schoolId, school);

    let email: string;
    let username: string | null = null;

    if (dto.role === UserRole.STUDENT) {
      if (!school) {
        throw new BadRequestException('Invalid or inactive school');
      }
      username = assertValidUsername(dto.username!);
      email = buildStudentLoginEmail(username, school.slug);
      const usernameTaken = await this.usersRepository.findOne({
        where: { schoolId: school.id, username },
      });
      if (usernameTaken) {
        throw new ConflictException('This username is already taken at your school');
      }
    } else {
      email = dto.email!.trim().toLowerCase();
    }

    if (dto.role === UserRole.PARENT && schoolId) {
      const features = await this.schoolFeatureService.getEffectiveFeatures(schoolId);
      if (!features.parentPortalEnabled) {
        throw new ForbiddenException(
          'Parent signup is not available for this school. Contact your school administrator.',
        );
      }
      await this.parentStudentLinkService.assertStudentsForParentEmail(schoolId, email);
    }

    const unlistedSchoolId = this.resolveUnlistedSchoolId();
    const isUnlistedStudent =
      dto.role === UserRole.STUDENT && schoolId === unlistedSchoolId;

    if (school && dto.role === UserRole.STUDENT) {
      if (dto.grade?.trim()) {
        this.schoolAcademicsService.assertGradeAllowed(school, dto.grade);
      }
      if (dto.section?.trim() && dto.grade?.trim()) {
        this.schoolAcademicsService.assertSectionAllowed(
          school,
          dto.section,
          dto.grade,
        );
      }
    }

    const existing = await this.usersRepository.findOne({
      where:
        schoolId === null
          ? { email, schoolId: IsNull() }
          : { email, schoolId },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists for this school');
    }

    const passwordHash = await this.passwordService.hash(dto.password);
    const parentEmail =
      dto.role === UserRole.STUDENT ? dto.parentEmail!.trim().toLowerCase() : null;

    const user = this.usersRepository.create({
      email,
      username,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      displayName: `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim(),
      role: dto.role,
      schoolId,
      grade: dto.role === UserRole.STUDENT ? dto.grade?.trim() || null : null,
      section: dto.role === UserRole.STUDENT ? dto.section?.trim() || null : null,
      parentEmail,
      signupSchoolNote: isUnlistedStudent ? dto.signupSchoolNote!.trim() : null,
      isActive: signupFlow !== 'pending',
      signupPendingAt: signupFlow === 'pending' ? new Date() : null,
      xpPoints: 0,
      currentStreak: 0,
    });

    const saved = await this.usersRepository.save(user);

    if (signupFlow === 'pending') {
      return {
        pendingApproval: true,
        message:
          dto.role === UserRole.TEACHER
            ? 'Your teacher account request was submitted. A school administrator will review it soon.'
            : 'Your student account request was submitted. A teacher at your school will review it soon.',
      };
    }

    if (saved.role === UserRole.PARENT && saved.schoolId) {
      await this.parentStudentLinkService.linkByParentEmail(
        saved.id,
        saved.schoolId,
        saved.email,
      );
    }

    return this.authService.issueTokensForUser(saved.id, this.sessionMetaFromRequest(req));
  }

  @Post('logout')
  async logout(@Req() req: Request): Promise<{ ok: true }> {
    const sessionId = await this.resolveSessionIdFromRequest(req);
    if (sessionId) {
      await this.sessionService.endSession(sessionId);
    }
    return { ok: true };
  }

  @Post('session/heartbeat')
  async heartbeat(@Req() req: Request): Promise<{ ok: true }> {
    const sessionId = await this.resolveSessionIdFromRequest(req);
    if (sessionId) {
      await this.sessionService.touchSession(sessionId);
    }
    return { ok: true };
  }

  /** Dev-only: issue a token signed with this server's JWT secret (no paste / secret mismatch). */
  @Public()
  @Post('dev/token')
  async devIssueToken(
    @Body() dto: DevIssueTokenDto,
    @Req() req: Request,
  ): Promise<AuthTokensResponse> {
    if (process.env.NODE_ENV === 'production') {
      throw new NotFoundException();
    }

    const userId = DEV_SEED_USER_IDS[resolveDevSeedRole(dto.role)];
    return this.authService.issueTokensForUser(userId, this.sessionMetaFromRequest(req));
  }

  private sessionMetaFromRequest(req: Request) {
    const forwarded = req.headers['x-forwarded-for'];
    const ip =
      (typeof forwarded === 'string' ? forwarded.split(',')[0]?.trim() : undefined) ||
      req.ip ||
      null;
    const userAgent =
      typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null;
    return { ipAddress: ip, userAgent };
  }

  private async resolveSessionIdFromRequest(req: Request): Promise<string | null> {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }
    const token = header.slice(7).trim();
    if (!token) {
      return null;
    }
    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      return payload.sid ?? null;
    } catch {
      return null;
    }
  }

  private resolveUnlistedSchoolId(): string {
    return (
      this.configService.get<string>('UNLISTED_SCHOOL_ID')?.trim() || UNLISTED_SCHOOL_ID
    );
  }

  private validateRegisterFields(dto: RegisterDto): void {
    if (dto.role === UserRole.STUDENT) {
      if (!dto.schoolId?.trim()) {
        throw new BadRequestException('School is required');
      }
      if (!dto.username?.trim()) {
        throw new BadRequestException('Username is required');
      }
      assertValidUsername(dto.username);
      if (!dto.parentEmail?.trim()) {
        throw new BadRequestException('Parent email is required');
      }
      if (!dto.grade?.trim()) {
        throw new BadRequestException('Grade is required');
      }
      if (!dto.section?.trim()) {
        throw new BadRequestException('Section is required');
      }
      const unlistedId = this.resolveUnlistedSchoolId();
      if (dto.schoolId.trim() === unlistedId) {
        const note = dto.signupSchoolNote?.trim();
        if (!note) {
          throw new BadRequestException(
            'School name and address are required when your school is not listed',
          );
        }
      }
    }

    if (dto.role === UserRole.PARENT && !dto.schoolId?.trim()) {
      throw new BadRequestException('School is required');
    }

    if (dto.role === UserRole.PARENT || dto.role === UserRole.TEACHER) {
      if (!dto.email?.trim()) {
        throw new BadRequestException('Email is required');
      }
    }
  }

  private async resolveSchoolId(
    schoolId: string | undefined,
    role: UserRole,
  ): Promise<string | null> {
    if (role === UserRole.SUPER_ADMIN) {
      return null;
    }

    const explicit = schoolId?.trim();

    if ((role === UserRole.STUDENT || role === UserRole.PARENT) && !explicit) {
      throw new BadRequestException('schoolId is required for this account type');
    }

    const target =
      explicit ||
      this.configService.get<string>('DEFAULT_SCHOOL_ID')?.trim() ||
      null;

    if (!target) {
      throw new ConflictException('schoolId is required for this account type');
    }

    const school = await this.schoolsRepository.findOne({
      where: { id: target, isActive: true },
    });
    if (!school) {
      throw new ConflictException('Invalid or inactive school');
    }

    await this.schoolLimitsService.assertCanAddUser(school.id, role);

    return school.id;
  }

  private resolveSignupFlow(
    dto: RegisterDto,
    schoolId: string | null,
    school: School | null,
  ): 'immediate' | 'pending' {
    const unlistedId = this.resolveUnlistedSchoolId();
    const schoolSlug = dto.schoolSlug?.trim().toLowerCase();

    if (schoolSlug) {
      if (dto.role === UserRole.PARENT) {
        throw new ForbiddenException('Parents should use the main signup page');
      }
      if (!school || school.slug !== schoolSlug) {
        throw new BadRequestException('School does not match the join link');
      }
      if (school.id === unlistedId) {
        throw new BadRequestException('Invalid school join link');
      }
      if (dto.role !== UserRole.STUDENT && dto.role !== UserRole.TEACHER) {
        throw new BadRequestException('Invalid role for school join');
      }
      return 'pending';
    }

    if (dto.role === UserRole.TEACHER) {
      throw new ForbiddenException(
        'Teacher accounts are created via your school invite link or by a school administrator.',
      );
    }

    if (dto.role === UserRole.STUDENT && schoolId !== unlistedId) {
      throw new ForbiddenException(
        'To join an onboarded school, use the invite link from your school or ask your administrator to add you.',
      );
    }

    return 'immediate';
  }
}
