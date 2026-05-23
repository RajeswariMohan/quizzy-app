export { AuthModule } from './auth.module';
export { AuthService } from './auth.service';
export { TenantContextMiddleware } from './middleware/tenant-context.middleware';
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { RolesGuard } from './guards/roles.guard';
export { PermissionsGuard } from './guards/permissions.guard';
export { JwtStrategy } from './strategies/jwt.strategy';
export { TokenService } from './services/token.service';
export { TenantContextService } from './services/tenant-context.service';
export * from './decorators';
export type { TenantContext } from './interfaces/tenant-context.interface';
export type { JwtPayload } from './interfaces/jwt-payload.interface';
export { Permission, hasPermission, ROLE_PERMISSIONS } from './rbac/role-permissions';
export {
  SUPER_ADMIN_ROLES,
  SCHOOL_ADMIN_ROLES,
  TEACHER_ROLES,
  STAFF_ROLES,
  LEARNER_ROLES,
  GUARDIAN_ROLES,
  TENANT_SCOPED_ROLES,
  isSuperAdmin,
  isStaffRole,
  isTenantScopedRole,
  roleRequiresSchoolId,
} from './rbac/role-groups';
