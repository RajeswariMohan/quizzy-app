import { NotFoundException } from '@nestjs/common';
import { Quiz } from '@database/entities/quiz.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';

/** Teachers and super admins may only manage quizzes they created; school admins see all in their school. */
export function assertQuizManageAccess(tenant: TenantContext, quiz: Quiz): void {
  if (
    (tenant.role === UserRole.TEACHER || tenant.role === UserRole.SUPER_ADMIN) &&
    quiz.createdByUserId !== tenant.userId
  ) {
    throw new NotFoundException('Quiz not found');
  }
}
