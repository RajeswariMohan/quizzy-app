import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { School } from '@database/entities/school.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { ParentStudentLinkService } from '../parent/parent-student-link.service';
import { SchoolLimitsService } from '../school/school-limits.service';
import { Public } from './decorators/public.decorator';
import { DEV_SEED_USER_IDS, resolveDevSeedRole } from './constants/dev-seed-users';
import { DevIssueTokenDto } from './dto/dev-issue-token.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService, AuthTokensResponse } from './auth.service';
import { PasswordService } from './services/password.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { SchoolAcademicsService } from '../school-admin/school-academics.service';

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
    private readonly sessionService: SessionService,
    private readonly tokenService: TokenService,
  ) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthTokensResponse> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersRepository
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('LOWER(u.email) = :email', { email })
      .andWhere('u.is_active = true')
      .getOne();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.passwordService.verify(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.authService.issueTokensForUser(user.id, this.sessionMetaFromRequest(req));
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
    return this.schoolAcademicsService.getForSchoolId(target);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthTokensResponse> {
    const email = dto.email.trim().toLowerCase();
    const schoolId = await this.resolveSchoolId(dto.schoolId, dto.role);

    if (schoolId && dto.role === UserRole.STUDENT) {
      const school = await this.schoolsRepository.findOne({
        where: { id: schoolId, isActive: true },
      });
      if (school) {
        if (dto.grade?.trim()) {
          this.schoolAcademicsService.assertGradeAllowed(school, dto.grade);
        }
        if (dto.subject?.trim()) {
          this.schoolAcademicsService.assertSubjectAllowed(school, dto.subject);
        }
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
    const user = this.usersRepository.create({
      email,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      displayName: `${dto.firstName.trim()} ${dto.lastName.trim()}`.trim(),
      role: dto.role,
      schoolId,
      isActive: true,
      xpPoints: 0,
      currentStreak: 0,
    });

    const saved = await this.usersRepository.save(user);

    if (
      saved.role === UserRole.PARENT &&
      dto.studentEmail?.trim() &&
      saved.schoolId
    ) {
      await this.parentStudentLinkService.linkByStudentEmail(
        saved.id,
        saved.schoolId,
        dto.studentEmail,
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

  private async resolveSchoolId(
    schoolId: string | undefined,
    role: UserRole,
  ): Promise<string | null> {
    if (role === UserRole.SUPER_ADMIN) {
      return null;
    }

    const target =
      schoolId?.trim() ||
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
}
