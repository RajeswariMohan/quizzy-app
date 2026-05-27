import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { LinkStudentDto } from './dto/link-student.dto';
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
  linkStudent(@CurrentTenant() tenant: TenantContext, @Body() dto: LinkStudentDto) {
    return this.parentService.linkStudent(tenant, dto.studentEmail);
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
