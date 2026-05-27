import { Body, Controller, Patch } from '@nestjs/common';
import { CurrentTenant } from '../auth';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Patch('me')
  updateProfile(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profileService.updateProfile(tenant, dto);
  }

  @Patch('me/password')
  changePassword(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.profileService.changePassword(tenant, dto);
  }
}
