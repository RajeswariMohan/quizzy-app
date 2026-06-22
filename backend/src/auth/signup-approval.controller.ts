import { Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, Roles } from './decorators';
import { TenantContext } from './interfaces/tenant-context.interface';
import { SignupApprovalService } from './services/signup-approval.service';

@Controller('teacher/pending-signups')
@Roles(UserRole.TEACHER, UserRole.SCHOOL_ADMIN)
export class TeacherSignupApprovalController {
  constructor(private readonly signupApprovalService: SignupApprovalService) {}

  @Get()
  listPending(@CurrentTenant() tenant: TenantContext) {
    const schoolId = tenant.schoolId ?? tenant.actingSchoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }
    return this.signupApprovalService.listPendingStudents(schoolId);
  }

  @Patch(':userId/approve')
  approve(
    @CurrentTenant() tenant: TenantContext,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    const schoolId = tenant.schoolId ?? tenant.actingSchoolId;
    if (!schoolId) {
      throw new NotFoundException('School context required');
    }
    const approverRole =
      tenant.role === UserRole.SCHOOL_ADMIN ? UserRole.SCHOOL_ADMIN : UserRole.TEACHER;
    return this.signupApprovalService.approvePendingUser(schoolId, userId, approverRole);
  }
}
