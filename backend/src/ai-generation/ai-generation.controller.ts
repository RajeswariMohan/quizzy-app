import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { AiGenerationService } from './ai-generation.service';

@Controller('ai-generation-tasks')
@Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
@RequirePermissions(Permission.TRIGGER_AI_GENERATION)
export class AiGenerationController {
  constructor(private readonly aiGenerationService: AiGenerationService) {}

  @Get(':taskId')
  async getTaskStatus(
    @CurrentTenant() tenant: TenantContext,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    const task = await this.aiGenerationService.getTask(tenant, taskId);

    return {
      taskId: task.id,
      quizId: task.quizId,
      status: task.status,
      requestedCount: task.requestedCount,
      completedCount: task.completedCount,
      failedCount: task.failedCount,
      aiModelUsed: task.aiModelUsed,
      errorMessage: task.errorMessage,
      metrics: task.metrics,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
    };
  }
}
