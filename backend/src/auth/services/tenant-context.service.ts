import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { School } from '@database/entities/school.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TenantContext } from '../interfaces/tenant-context.interface';
import {
  isSuperAdmin,
  isTenantScopedRole,
  roleRequiresSchoolId,
} from '../rbac/role-groups';

@Injectable()
export class TenantContextService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Validates JWT claims shape and school_id rules, then confirms the user
   * still exists and matches the token (prevents stale or tampered claims).
   */
  async buildFromPayload(payload: JwtPayload): Promise<TenantContext> {
    this.assertPayloadShape(payload);

    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      relations: ['school'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or does not exist');
    }

    if (user.role !== payload.role) {
      throw new UnauthorizedException('Token role does not match user record');
    }

    if (user.email !== payload.email) {
      throw new UnauthorizedException('Token identity does not match user record');
    }

    const tokenSchoolId = payload.school_id ?? null;
    const userSchoolId = user.schoolId ?? null;

    if (tokenSchoolId !== userSchoolId) {
      throw new UnauthorizedException('Token school_id does not match user record');
    }

    this.assertSchoolIdRules(user.role, userSchoolId);

    if (user.school && !user.school.isActive) {
      throw new ForbiddenException('School tenant is inactive');
    }

    return this.toTenantContext(user.id, user.email, user.role, userSchoolId);
  }

  /**
   * SUPER_ADMIN: resolve read scope from X-School-Ids (all | uuid,uuid) or X-School-Id.
   */
  async applySuperAdminScope(
    context: TenantContext,
    headerSchoolIds?: string,
    headerSchoolId?: string,
  ): Promise<TenantContext> {
    if (!context.isSuperAdmin) {
      const id = context.schoolId;
      return {
        ...context,
        actingSchoolId: id,
        querySchoolIds: id ? [id] : [],
      };
    }

    const querySchoolIds = await this.resolveSuperAdminSchoolIds(
      headerSchoolIds,
      headerSchoolId,
    );

    return {
      ...context,
      querySchoolIds,
      actingSchoolId: querySchoolIds[0] ?? null,
    };
  }

  /** @deprecated Use applySuperAdminScope */
  async applyActingSchool(
    context: TenantContext,
    headerSchoolId?: string,
  ): Promise<TenantContext> {
    return this.applySuperAdminScope(context, undefined, headerSchoolId);
  }

  async resolveSuperAdminSchoolIds(
    headerSchoolIds?: string,
    headerSchoolId?: string,
  ): Promise<string[]> {
    const raw = headerSchoolIds?.trim();
    if (raw?.toLowerCase() === 'all') {
      return this.loadAllActiveSchoolIds();
    }

    if (raw) {
      const ids = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return this.validateActiveSchoolIds(ids);
    }

    const single =
      headerSchoolId?.trim() ||
      this.configService.get<string>('DEFAULT_SCHOOL_ID')?.trim();
    if (single) {
      return this.validateActiveSchoolIds([single]);
    }

    return this.loadAllActiveSchoolIds();
  }

  private async loadAllActiveSchoolIds(): Promise<string[]> {
    const schools = await this.schoolsRepository.find({
      where: { isActive: true },
      select: ['id'],
      order: { name: 'ASC' },
    });
    if (schools.length === 0) {
      throw new ForbiddenException('No active schools found');
    }
    return schools.map((s) => s.id);
  }

  private async validateActiveSchoolIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) {
      throw new ForbiddenException('At least one school_id is required');
    }

    const schools = await this.schoolsRepository.find({
      where: { id: In(ids), isActive: true },
      select: ['id'],
    });

    if (schools.length !== ids.length) {
      throw new ForbiddenException('One or more school_ids are invalid or inactive');
    }

    return ids;
  }

  toTenantContext(
    userId: string,
    email: string,
    role: UserRole,
    schoolId: string | null,
  ): TenantContext {
    this.assertSchoolIdRules(role, schoolId);

    return {
      userId,
      email,
      role,
      schoolId,
      actingSchoolId: isSuperAdmin(role) ? null : schoolId,
      querySchoolIds: isSuperAdmin(role) ? [] : schoolId ? [schoolId] : [],
      isSuperAdmin: isSuperAdmin(role),
      isTenantScoped: isTenantScopedRole(role),
    };
  }

  /** School IDs for aggregated read queries (dashboard, quiz list). */
  resolveSchoolIdsForQuery(context: TenantContext): string[] {
    if (context.isSuperAdmin) {
      if (!context.querySchoolIds?.length) {
        throw new ForbiddenException(
          'Super Admin must specify school scope (X-School-Ids: all or comma-separated UUIDs)',
        );
      }
      return context.querySchoolIds;
    }

    if (!context.schoolId) {
      throw new ForbiddenException('Missing tenant school_id on authenticated user');
    }

    return [context.schoolId];
  }

  /**
   * Returns the school_id that must be used for tenant-scoped DB queries.
   * Super admins may pass an explicit targetSchoolId for cross-tenant ops.
   */
  resolveSchoolIdForQuery(
    context: TenantContext,
    targetSchoolId?: string,
  ): string {
    if (context.isSuperAdmin) {
      const resolved =
        targetSchoolId ?? context.actingSchoolId ?? context.querySchoolIds?.[0];
      if (!resolved) {
        throw new ForbiddenException(
          'Super Admin must specify a school context (X-School-Ids or X-School-Id header)',
        );
      }
      return resolved;
    }

    if (!context.schoolId) {
      throw new ForbiddenException('Missing tenant school_id on authenticated user');
    }

    if (targetSchoolId && targetSchoolId !== context.schoolId) {
      throw new ForbiddenException('Access denied for the requested school tenant');
    }

    return context.schoolId;
  }

  assertCanAccessSchool(context: TenantContext, schoolId: string): void {
    if (context.isSuperAdmin) {
      return;
    }
    if (context.schoolId !== schoolId) {
      throw new ForbiddenException('Cross-tenant access denied');
    }
  }

  private assertPayloadShape(payload: JwtPayload): void {
    if (!payload?.sub || !payload?.email || !payload?.role) {
      throw new UnauthorizedException('Invalid token payload');
    }
  }

  private assertSchoolIdRules(role: UserRole, schoolId: string | null): void {
    if (isSuperAdmin(role)) {
      if (schoolId !== null) {
        throw new UnauthorizedException('Super Admin must not be bound to a school_id');
      }
      return;
    }

    if (roleRequiresSchoolId(role) && !schoolId) {
      throw new UnauthorizedException(
        `${role} accounts must include a valid school_id in the token`,
      );
    }
  }
}
