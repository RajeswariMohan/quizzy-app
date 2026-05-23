import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@database/enums/user-role.enum';
import { ROLES_KEY } from '../constants/auth.constants';
import { TenantContext } from '../interfaces/tenant-context.interface';

/**
 * RBAC guard — enforces @Roles() metadata against the verified tenantContext.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ tenantContext?: TenantContext }>();
    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException('Authentication required for role check');
    }

    const allowed = requiredRoles.includes(tenantContext.role);

    if (!allowed) {
      throw new ForbiddenException(
        `Role ${tenantContext.role} is not authorized for this resource`,
      );
    }

    return true;
  }
}
