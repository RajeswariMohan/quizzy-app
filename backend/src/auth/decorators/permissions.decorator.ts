import { SetMetadata } from '@nestjs/common';
import { Permission } from '../rbac/role-permissions';

export const PERMISSIONS_KEY = 'permissions';

/** Restricts a route by coarse Permission flags (use with PermissionsGuard). */
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
