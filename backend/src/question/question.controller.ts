import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { AiGenerationService } from '../ai-generation/ai-generation.service';
import { AiGenerateQuestionsDto } from './dto/ai-generate-questions.dto';
import { CreateManualQuestionDto } from './dto/create-manual-question.dto';
import { QuestionService } from './question.service';

@Controller('quizzes/:quizId/questions')
@Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER)
export class QuestionController {
  constructor(
    private readonly questionService: QuestionService,
    private readonly aiGenerationService: AiGenerationService,
  ) {}

  @Get()
  @RequirePermissions(Permission.MANAGE_QUESTIONS)
  async list(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
  ) {
    const questions = await this.questionService.listByQuiz(tenant, quizId);
    return questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: q.options,
      correctOptionIndex: q.correctOptionIndex,
      explanation: q.explanation,
      orderIndex: q.orderIndex,
      sourceType: q.sourceType,
      aiModelUsed: q.aiModelUsed,
      aiGenerationTaskId: q.aiGenerationTaskId,
      points: q.points,
    }));
  }

  @Post('manual')
  @RequirePermissions(Permission.MANAGE_QUESTIONS)
  async createManual(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: CreateManualQuestionDto,
  ) {
    const question = await this.questionService.createManual(tenant, quizId, dto);
    return {
      id: question.id,
      quizId: question.quizId,
      schoolId: question.schoolId,
      sourceType: question.sourceType,
      orderIndex: question.orderIndex,
      createdAt: question.createdAt,
    };
  }

  @Post('ai-generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermissions(Permission.TRIGGER_AI_GENERATION)
  async enqueueAiGeneration(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: AiGenerateQuestionsDto,
  ) {
    const result = await this.aiGenerationService.enqueueGeneration(tenant, quizId, dto);
    return {
      taskId: result.taskId,
      status: result.status,
      jobId: result.jobId,
      message: 'AI question generation queued. Poll GET /api/ai-generation-tasks/:taskId for status.',
    };
  }
}
