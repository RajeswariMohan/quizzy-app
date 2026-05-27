import { Controller, Get } from '@nestjs/common';
import { CurrentTenant, Public } from './auth';
import { TenantContext } from './auth/interfaces/tenant-context.interface';
import { ProfileService } from './profile/profile.service';

@Controller()
export class AppController {
  constructor(private readonly profileService: ProfileService) {}
  @Public()
  @Get('health')
  health() {
    return { status: 'ok', service: 'quizzy-api' };
  }

  /** Returns the authenticated user's profile (all roles). */
  @Get('me')
  me(@CurrentTenant() tenant: TenantContext) {
    return this.profileService.getProfile(tenant);
  }
}
