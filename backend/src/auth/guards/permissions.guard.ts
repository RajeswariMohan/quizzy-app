import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { TenantContext } from '../interfaces/tenant-context.interface';
import { hasPermission, Permission } from '../rbac/role-permissions';

/**
 * Fine-grained RBAC guard using Permission enum metadata.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ tenantContext?: TenantContext }>();
    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new ForbiddenException('Authentication required for permission check');
    }

    const allowed = requiredPermissions.some((permission) =>
      hasPermission(tenantContext.role, permission),
    );

    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions for this resource');
    }

    return true;
  }
}
