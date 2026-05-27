import { Controller, Get, Param, Query } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { ProgressStudentsQueryDto } from './dto/progress-students-query.dto';
import { ProgressService } from './progress.service';

@Controller('progress')
@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN, UserRole.PARENT)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('students')
  @RequirePermissions(Permission.VIEW_SCHOOL_ANALYTICS, Permission.VIEW_CHILD_PROGRESS)
  listStudents(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: ProgressStudentsQueryDto,
  ) {
    return this.progressService.listStudents(tenant, query);
  }

  @Get('students/:studentId')
  @RequirePermissions(Permission.VIEW_SCHOOL_ANALYTICS, Permission.VIEW_CHILD_PROGRESS)
  getStudentOverview(
    @CurrentTenant() tenant: TenantContext,
    @Param('studentId') studentId: string,
  ) {
    return this.progressService.getStudentOverview(tenant, studentId);
  }

  @Get('students/:studentId/quizzes')
  @RequirePermissions(Permission.VIEW_SCHOOL_ANALYTICS, Permission.VIEW_CHILD_PROGRESS)
  listStudentQuizzes(
    @CurrentTenant() tenant: TenantContext,
    @Param('studentId') studentId: string,
  ) {
    return this.progressService.listStudentQuizzes(tenant, studentId);
  }

  @Get('students/:studentId/quizzes/:quizId')
  @RequirePermissions(Permission.VIEW_SCHOOL_ANALYTICS, Permission.VIEW_CHILD_PROGRESS)
  getStudentQuizDetail(
    @CurrentTenant() tenant: TenantContext,
    @Param('studentId') studentId: string,
    @Param('quizId') quizId: string,
  ) {
    return this.progressService.getStudentQuizDetail(tenant, studentId, quizId);
  }
}
