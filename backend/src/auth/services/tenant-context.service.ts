import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
      isSuperAdmin: isSuperAdmin(role),
      isTenantScoped: isTenantScopedRole(role),
    };
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
      if (!targetSchoolId) {
        throw new ForbiddenException(
          'Super Admin must specify an explicit school_id for tenant-scoped operations',
        );
      }
      return targetSchoolId;
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
