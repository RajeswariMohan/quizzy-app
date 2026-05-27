import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { DashboardAnalyticsQueryDto } from './dto/dashboard-analytics-query.dto';
import { PublishQuizDto } from './dto/publish-quiz.dto';
import { QuizService } from './quiz.service';
import { mapQuizCreator } from './quiz-creator.util';

@Controller('quizzes')
@Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @RequirePermissions(Permission.MANAGE_QUIZZES)
  list(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: DashboardAnalyticsQueryDto,
  ) {
    return this.quizService.listForTeacher(tenant, query);
  }

  @Get('dashboard/overview')
  @RequirePermissions(Permission.VIEW_SCHOOL_ANALYTICS)
  dashboard(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: DashboardAnalyticsQueryDto,
  ) {
    return this.quizService.getTeacherDashboard(tenant, query);
  }

  @Post()
  @RequirePermissions(Permission.MANAGE_QUIZZES)
  async create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateQuizDto) {
    const quiz = await this.quizService.create(tenant, dto);
    const creator = await this.quizService.resolveCreatorForUser(tenant.userId);
    return {
      id: quiz.id,
      schoolId: quiz.schoolId,
      classId: quiz.classId,
      title: quiz.title,
      status: quiz.status,
      subject: quiz.subject,
      topic: quiz.topic,
      board: quiz.board,
      grade: quiz.grade,
      createdBy: creator,
      createdAt: quiz.createdAt,
    };
  }

  @Patch(':quizId/publish')
  @RequirePermissions(Permission.MANAGE_QUIZZES)
  publish(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: PublishQuizDto,
  ) {
    return this.quizService.publish(tenant, quizId, dto);
  }

  @Patch(':quizId/unpublish')
  @RequirePermissions(Permission.MANAGE_QUIZZES)
  unpublish(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    return this.quizService.unpublish(tenant, quizId);
  }

  @Patch(':quizId')
  @RequirePermissions(Permission.MANAGE_QUIZZES)
  update(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: UpdateQuizDto,
  ) {
    return this.quizService.update(tenant, quizId, dto);
  }

  @Get(':quizId')
  @RequirePermissions(Permission.MANAGE_QUIZZES)
  async findOne(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    const quiz = await this.quizService.findOne(tenant, quizId);
    return {
      id: quiz.id,
      schoolId: quiz.schoolId,
      classId: quiz.classId,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      subject: quiz.subject,
      topic: quiz.topic,
      board: quiz.board,
      grade: quiz.grade,
      questionCount: quiz.questions?.length ?? 0,
      createdBy: mapQuizCreator(quiz.createdBy),
      createdAt: quiz.createdAt,
    };
  }
}
