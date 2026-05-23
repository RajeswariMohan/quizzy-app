import { UserRole } from '@database/enums/user-role.enum';

/**
 * Trusted tenant + identity context derived from a verified JWT.
 * Attached to every authenticated API request by TenantContextMiddleware.
 */
export interface TenantContext {
  userId: string;
  email: string;
  role: UserRole;
  /** Null only for SUPER_ADMIN */
  schoolId: string | null;
  isSuperAdmin: boolean;
  /** True when queries must be scoped by schoolId */
  isTenantScoped: boolean;
}
