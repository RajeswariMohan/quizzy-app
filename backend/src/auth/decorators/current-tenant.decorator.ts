import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../interfaces/tenant-context.interface';

/** Injects the verified `tenantContext` from the request. */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantContext => {
    const request = ctx.switchToHttp().getRequest<{ tenantContext?: TenantContext }>();
    const tenantContext = request.tenantContext;

    if (!tenantContext) {
      throw new Error(
        'tenantContext is missing. Ensure TenantContextMiddleware is applied and JwtAuthGuard protects this route.',
      );
    }

    return tenantContext;
  },
);
