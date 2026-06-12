import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, Public, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { AdminService } from './admin.service';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { CreateSchoolAdminDto } from './dto/create-school-admin.dto';
import { UpdateSchoolAdminDto } from './dto/update-school-admin.dto';
import {
  AdminOverviewQueryDto,
  AdminSchoolsStatusFilter,
} from './dto/admin-overview-query.dto';
import { UpdateSubscriptionPackagesDto } from './dto/update-subscription-packages.dto';

@Controller()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Get('admin/overview')
  getOverview(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: AdminOverviewQueryDto,
  ) {
    const schoolIds = this.tenantContextService.resolveSchoolIdsForQuery(tenant);
    return this.adminService.getPlatformOverview(
      schoolIds,
      query.schoolsStatus ?? AdminSchoolsStatusFilter.ACTIVE,
    );
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Get('admin/analytics/schools')
  getSchoolAnalytics(@CurrentTenant() tenant: TenantContext) {
    const schoolIds = this.tenantContextService.resolveSchoolIdsForQuery(tenant);
    return this.adminService.getSchoolAnalytics(schoolIds);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Get('admin/settings')
  getSettings() {
    return this.adminService.getSettings();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Patch('admin/settings')
  updateSettings(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdatePlatformSettingsDto,
  ) {
    return this.adminService.updateSettings(dto, tenant.userId);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Get('admin/subscription-packages')
  getSubscriptionPackages() {
    return this.adminService.getSubscriptionPackages();
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Patch('admin/subscription-packages')
  updateSubscriptionPackages(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateSubscriptionPackagesDto,
  ) {
    return this.adminService.updateSubscriptionPackages(dto, tenant.userId);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Post('admin/schools')
  createSchool(@Body() dto: CreateSchoolDto) {
    return this.adminService.createSchool(dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Patch('admin/schools/:schoolId')
  updateSchool(
    @Param('schoolId', ParseUUIDPipe) schoolId: string,
    @Body() dto: UpdateSchoolDto,
  ) {
    return this.adminService.updateSchool(schoolId, dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Get('admin/schools/:schoolId/admins')
  listSchoolAdmins(@Param('schoolId') schoolId: string) {
    return this.adminService.listSchoolAdmins(schoolId);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Post('admin/schools/:schoolId/admins')
  createSchoolAdmin(
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateSchoolAdminDto,
  ) {
    return this.adminService.createSchoolAdmin(schoolId, dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @RequirePermissions(Permission.MANAGE_PLATFORM)
  @Patch('admin/schools/:schoolId/admins/:userId')
  updateSchoolAdmin(
    @Param('schoolId') schoolId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateSchoolAdminDto,
  ) {
    return this.adminService.updateSchoolAdmin(schoolId, userId, dto);
  }

  /** Authenticated clients read feature availability (no admin role required) */
  @Public()
  @Get('platform/features')
  getPublicFeatures() {
    return this.adminService.getPublicFeatures();
  }
}
