import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { StudentAudienceQueryDto } from './dto/student-audience-query.dto';
import { SubmitResponseDto } from './dto/submit-response.dto';
import { StudentQuizService } from './student-quiz.service';

@Controller('student')
@Roles(UserRole.STUDENT)
export class StudentQuizController {
  constructor(private readonly studentQuizService: StudentQuizService) {}

  @Get('audience-options')
  @RequirePermissions(Permission.TAKE_QUIZ)
  getAudienceOptions(@CurrentTenant() tenant: TenantContext) {
    return this.studentQuizService.getAudienceOptions(tenant);
  }

  @Get('quizzes')
  @RequirePermissions(Permission.TAKE_QUIZ)
  listQuizzes(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: StudentAudienceQueryDto,
  ) {
    return this.studentQuizService.listPublishedQuizzes(tenant, query);
  }

  @Get('quizzes/:quizId')
  @RequirePermissions(Permission.TAKE_QUIZ)
  getQuiz(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    return this.studentQuizService.getQuizForTaking(tenant, quizId);
  }

  @Post('quizzes/:quizId/responses')
  @RequirePermissions(Permission.TAKE_QUIZ)
  submitResponse(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: SubmitResponseDto,
  ) {
    return this.studentQuizService.submitResponse(tenant, quizId, dto);
  }

  @Get('progress')
  @RequirePermissions(Permission.VIEW_OWN_PROGRESS)
  getProgress(@CurrentTenant() tenant: TenantContext) {
    return this.studentQuizService.getProgress(tenant);
  }

  @Get('leaderboard')
  @RequirePermissions(Permission.VIEW_OWN_PROGRESS)
  getLeaderboard(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: StudentAudienceQueryDto,
  ) {
    return this.studentQuizService.getLeaderboard(tenant, query);
  }
}
