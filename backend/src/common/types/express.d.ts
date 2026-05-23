import { TenantContext } from '../../auth/interfaces/tenant-context.interface';

declare global {
  namespace Express {
    interface Request {
      /** Verified tenant + user context attached by TenantContextMiddleware */
      tenantContext?: TenantContext;
    }
  }
}

export {};
