import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_STRATEGY_NAME } from '../constants/auth.constants';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { TenantContext } from '../interfaces/tenant-context.interface';
import { TenantContextService } from '../services/tenant-context.service';
import { getJwtSecret } from '../../config/env.config';

/**
 * Passport JWT strategy — re-validates payload and returns TenantContext for guards.
 * Primary tenant attachment happens in TenantContextMiddleware; this strategy
 * ensures Passport-protected routes receive the same verified context.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, JWT_STRATEGY_NAME) {
  constructor(
    @Inject(ConfigService) configService: ConfigService,
    private readonly tenantContextService: TenantContextService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(configService),
    });
  }

  async validate(payload: JwtPayload): Promise<TenantContext> {
    try {
      return await this.tenantContextService.buildFromPayload(payload);
    } catch {
      throw new UnauthorizedException();
    }
  }
}
