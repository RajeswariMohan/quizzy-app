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
  /** For SUPER_ADMIN: primary school for writes (first selected / X-School-Id) */
  actingSchoolId: string | null;
  /** School IDs included in read/analytics queries (one or many, or all active) */
  querySchoolIds: string[];
  isSuperAdmin: boolean;
  /** True when queries must be scoped by schoolId */
  isTenantScoped: boolean;
}
