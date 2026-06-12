import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { CreateSchoolUserDto } from './dto/create-school-user.dto';
import { BulkImportSchoolUsersDto } from './dto/bulk-import-school-users.dto';
import { UpdateSchoolAcademicsDto } from './dto/update-school-academics.dto';
import { UpdateSchoolUserDto } from './dto/update-school-user.dto';
import {
  ListSchoolUsersQueryDto,
} from './dto/list-school-users-query.dto';
import { SetUserStatusDto } from './dto/set-user-status.dto';
import { SchoolAdminService } from './school-admin.service';

@Controller('school-admin')
@Roles(UserRole.SCHOOL_ADMIN)
export class SchoolAdminController {
  constructor(private readonly schoolAdminService: SchoolAdminService) {}

  @Get('overview')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  getOverview(@CurrentTenant() tenant: TenantContext) {
    return this.schoolAdminService.getOverview(tenant);
  }

  @Get('academics')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  getAcademicConfig(@CurrentTenant() tenant: TenantContext) {
    return this.schoolAdminService.getAcademicConfig(tenant);
  }

  @Patch('academics')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  updateAcademicConfig(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateSchoolAcademicsDto,
  ) {
    return this.schoolAdminService.updateAcademicConfig(tenant, dto);
  }

  @Get('users')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  listUsers(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ListSchoolUsersQueryDto,
  ) {
    return this.schoolAdminService.listUsers(tenant, query);
  }

  @Post('users/bulk')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  bulkCreateUsers(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: BulkImportSchoolUsersDto,
  ) {
    return this.schoolAdminService.bulkCreateUsers(tenant, dto.users);
  }

  @Post('users')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  createUser(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateSchoolUserDto) {
    return this.schoolAdminService.createUser(tenant, dto);
  }

  @Patch('users/:userId')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  updateUser(
    @CurrentTenant() tenant: TenantContext,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateSchoolUserDto,
  ) {
    return this.schoolAdminService.updateUser(tenant, userId, dto);
  }

  @Patch('users/:userId/status')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  setUserStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() body: SetUserStatusDto,
  ) {
    return this.schoolAdminService.setUserActive(tenant, userId, body.isActive);
  }

  @Delete('users/:userId')
  @RequirePermissions(Permission.MANAGE_SCHOOL)
  deleteUser(
    @CurrentTenant() tenant: TenantContext,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.schoolAdminService.deleteUser(tenant, userId);
  }
}
