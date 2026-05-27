import { Controller, Get } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, Roles } from '../auth';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { SchoolAdminService } from './school-admin.service';

/** Read-only academic options for teachers, students, and admins in a school. */
@Controller('school')
export class SchoolAcademicsController {
  constructor(private readonly schoolAdminService: SchoolAdminService) {}

  @Get('academics')
  @Roles(
    UserRole.SCHOOL_ADMIN,
    UserRole.TEACHER,
    UserRole.STUDENT,
    UserRole.PARENT,
    UserRole.SUPER_ADMIN,
  )
  getAcademics(@CurrentTenant() tenant: TenantContext) {
    return this.schoolAdminService.getAcademicConfigForTenant(tenant);
  }
}
