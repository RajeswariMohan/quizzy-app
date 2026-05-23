import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { QuizService } from './quiz.service';

@Controller('quizzes')
@Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post()
  @RequirePermissions(Permission.MANAGE_QUIZZES)
  async create(@CurrentTenant() tenant: TenantContext, @Body() dto: CreateQuizDto) {
    const quiz = await this.quizService.create(tenant, dto);
    return {
      id: quiz.id,
      schoolId: quiz.schoolId,
      classId: quiz.classId,
      title: quiz.title,
      status: quiz.status,
      createdAt: quiz.createdAt,
    };
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
      questionCount: quiz.questions?.length ?? 0,
      createdAt: quiz.createdAt,
    };
  }
}
