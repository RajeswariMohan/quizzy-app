import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TenantContextService } from '../services/tenant-context.service';
import { TokenService } from '../services/token.service';

/**
 * Decodes the Bearer JWT, verifies signature and claims, validates school_id
 * against the user record, and attaches `req.tenantContext` for downstream handlers.
 */
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly tokenService: TokenService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const token = this.extractBearerToken(req);

    if (!token) {
      return next();
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      req.tenantContext = await this.tenantContextService.buildFromPayload(payload);
      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        next(error);
        return;
      }
      next(new UnauthorizedException('Invalid or expired access token'));
    }
  }

  private extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }
    const token = header.slice(7).trim();
    return token.length > 0 ? token : null;
  }
}
