import { Controller, ForbiddenException, Get, Post, Query } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { ParentService } from './parent.service';

@Controller('parent')
@Roles(UserRole.PARENT)
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('children')
  @RequirePermissions(Permission.VIEW_CHILD_PROGRESS)
  listChildren(@CurrentTenant() tenant: TenantContext) {
    return this.parentService.listLinkedChildren(tenant);
  }

  @Post('link')
  @RequirePermissions(Permission.VIEW_CHILD_PROGRESS)
  linkStudent() {
    throw new ForbiddenException(
      'Manual linking is disabled. Register as a parent using the same email your child entered at signup.',
    );
  }

  @Get('child-summary')
  @RequirePermissions(Permission.VIEW_CHILD_PROGRESS)
  getChildSummary(
    @CurrentTenant() tenant: TenantContext,
    @Query('studentId') studentId?: string,
  ) {
    return this.parentService.getChildSummary(tenant, studentId?.trim() || undefined);
  }
}
