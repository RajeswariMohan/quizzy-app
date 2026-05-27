import { Controller, Get, Query } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { EngagementQueryDto } from './dto/engagement-query.dto';
import { EngagementService } from './engagement.service';

@Controller('engagement')
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get('overview')
  @Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.VIEW_SCHOOL_ANALYTICS)
  getOverview(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: EngagementQueryDto,
  ) {
    return this.engagementService.getOverview(tenant, query);
  }

  @Get('me')
  getMyStats(@CurrentTenant() tenant: TenantContext) {
    return this.engagementService.getMySessionStats(tenant);
  }
}
