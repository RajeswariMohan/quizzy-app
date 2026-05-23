import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY, JWT_STRATEGY_NAME } from '../constants/auth.constants';
import { TenantContext } from '../interfaces/tenant-context.interface';

/**
 * Ensures the request carries a verified tenantContext (from middleware or Passport).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard(JWT_STRATEGY_NAME) {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ tenantContext?: TenantContext }>();

    if (request.tenantContext) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TTenant extends TenantContext>(
    err: Error | null,
    user: TTenant | false,
    _info: unknown,
    context: ExecutionContext,
  ): TTenant {
    const request = context.switchToHttp().getRequest<{ tenantContext?: TenantContext }>();

    if (request.tenantContext) {
      return request.tenantContext as TTenant;
    }

    if (err || !user) {
      throw err ?? new UnauthorizedException('Authentication required');
    }

    request.tenantContext = user;
    return user;
  }
}
