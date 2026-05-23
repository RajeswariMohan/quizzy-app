import { Controller, Get } from '@nestjs/common';
import { CurrentTenant, Public } from './auth';
import { TenantContext } from './auth/interfaces/tenant-context.interface';

@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'quizzy-api' };
  }

  /** Returns the authenticated user's tenant profile (all roles). */
  @Get('me')
  me(@CurrentTenant() tenant: TenantContext) {
    return {
      userId: tenant.userId,
      email: tenant.email,
      role: tenant.role,
      schoolId: tenant.schoolId,
      isTenantScoped: tenant.isTenantScoped,
    };
  }
}
