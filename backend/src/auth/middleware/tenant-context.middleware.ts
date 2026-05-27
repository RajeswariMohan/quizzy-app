import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { SessionService } from '../services/session.service';
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
    private readonly sessionService: SessionService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    const token = this.extractBearerToken(req);

    if (!token) {
      return next();
    }

    try {
      const payload = await this.tokenService.verifyAccessToken(token);
      if (payload.sid) {
        await this.sessionService.assertSessionActive(payload.sid);
      }
      const context = await this.tenantContextService.buildFromPayload(payload);
      const schoolIdsHeader = this.headerValue(req.headers['x-school-ids']);
      const schoolIdHeader = this.headerValue(req.headers['x-school-id']);
      req.tenantContext = await this.tenantContextService.applySuperAdminScope(
        context,
        schoolIdsHeader,
        schoolIdHeader,
      );
      if (payload.sid) {
        void this.sessionService.touchSession(payload.sid);
      }
      next();
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        next(error);
        return;
      }
      next(new UnauthorizedException('Invalid or expired access token'));
    }
  }

  private headerValue(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0];
    return value;
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
