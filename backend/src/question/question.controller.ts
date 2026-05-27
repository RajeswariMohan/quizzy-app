import {
  Body,
  Controller,
  Get,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { CurrentTenant, RequirePermissions, Roles } from '../auth';
import { Permission } from '../auth/rbac/role-permissions';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { AiGenerationService } from '../ai-generation/ai-generation.service';
import { AiGenerateQuestionsDto } from './dto/ai-generate-questions.dto';
import { CreateManualQuestionDto } from './dto/create-manual-question.dto';
import { BulkImportQuestionsDto } from './dto/bulk-import-questions.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
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

  @Delete(':questionId')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions(Permission.MANAGE_QUESTIONS)
  remove(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
  ) {
    return this.questionService.remove(tenant, quizId, questionId);
  }

  @Patch(':questionId')
  @RequirePermissions(Permission.MANAGE_QUESTIONS)
  async update(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    const question = await this.questionService.update(tenant, quizId, questionId, dto);
    return {
      id: question.id,
      questionText: question.questionText,
      options: question.options,
      correctOptionIndex: question.correctOptionIndex,
      explanation: question.explanation,
      orderIndex: question.orderIndex,
      sourceType: question.sourceType,
      points: question.points,
    };
  }

  @Post('bulk')
  @RequirePermissions(Permission.MANAGE_QUESTIONS)
  async bulkImport(
    @CurrentTenant() tenant: TenantContext,
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @Body() dto: BulkImportQuestionsDto,
  ) {
    return this.questionService.bulkCreateManual(tenant, quizId, dto.questions);
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
