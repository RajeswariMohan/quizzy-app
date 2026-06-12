import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { AiGenerationTask } from '@database/entities/ai-generation-task.entity';
import { AiGenerationStatus } from '@database/enums/ai-generation-status.enum';
import { Question } from '@database/entities/question.entity';
import { QuestionSourceType } from '@database/enums/question-source-type.enum';
import { Quiz } from '@database/entities/quiz.entity';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { assertQuizManageAccess } from '../quiz/quiz-access.util';
import { SchoolFeatureService } from '../school/school-feature.service';
import { MOCK_LLM_MODEL, MockLlmService } from '../llm/mock-llm.service';
import { parseStructuredLlmOutput } from '../llm/llm-output.validator';
import { AI_QUESTION_GENERATION_QUEUE } from '../queue/queue.constants';
import { AiGenerateQuestionsDto } from '../question/dto/ai-generate-questions.dto';
import { AiGenerationJobData } from './interfaces/ai-generation-job.interface';

@Injectable()
export class AiGenerationService {
  constructor(
    @InjectRepository(AiGenerationTask)
    private readonly taskRepository: Repository<AiGenerationTask>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectQueue(AI_QUESTION_GENERATION_QUEUE)
    private readonly aiQueue: Queue<AiGenerationJobData>,
    private readonly tenantContextService: TenantContextService,
    private readonly schoolFeatureService: SchoolFeatureService,
    private readonly mockLlmService: MockLlmService,
  ) {}

  async enqueueGeneration(
    tenant: TenantContext,
    quizId: string,
    dto: AiGenerateQuestionsDto,
  ): Promise<{ taskId: string; status: AiGenerationStatus; jobId: string }> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    await this.schoolFeatureService.assertFeature(schoolId, 'aiGenerationEnabled');
    await this.assertQuizInTenant(tenant, quizId);

    const task = this.taskRepository.create({
      schoolId,
      quizId,
      requestedByUserId: tenant.userId,
      status: AiGenerationStatus.PENDING,
      prompt: dto.prompt,
      board: dto.board ?? null,
      grade: dto.grade ?? null,
      subject: dto.subject ?? null,
      topic: dto.topic ?? null,
      sourceText: dto.sourceText ?? null,
      requestedCount: dto.count,
      completedCount: 0,
      failedCount: 0,
      metrics: {},
    });

    const savedTask = await this.taskRepository.save(task);

    const job = await this.aiQueue.add(
      'generate-questions',
      {
        taskId: savedTask.id,
        schoolId,
        quizId,
        requestedByUserId: tenant.userId,
      },
      {
        jobId: savedTask.id,
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    savedTask.bullJobId = job.id ?? savedTask.id;
    await this.taskRepository.save(savedTask);

    return {
      taskId: savedTask.id,
      status: savedTask.status,
      jobId: savedTask.bullJobId,
    };
  }

  async getTask(tenant: TenantContext, taskId: string): Promise<AiGenerationTask> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const task = await this.taskRepository.findOne({
      where: { id: taskId, schoolId },
    });

    if (!task) {
      throw new NotFoundException('AI generation task not found');
    }

    return task;
  }

  /** Invoked by BullMQ processor */
  async processJob(data: AiGenerationJobData): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id: data.taskId, schoolId: data.schoolId },
    });

    if (!task) {
      return;
    }

    const parseStarted = Date.now();

    try {
      await this.markProcessing(task.id);

      const llmResult = await this.mockLlmService.generateMcqs({
        prompt: task.prompt,
        count: task.requestedCount,
        board: task.board ?? undefined,
        grade: task.grade ?? undefined,
        subject: task.subject ?? undefined,
        topic: task.topic ?? undefined,
        sourceText: task.sourceText ?? undefined,
      });

      const validated = parseStructuredLlmOutput({ questions: llmResult.questions });
      const parseDurationMs = Date.now() - parseStarted;

      const quiz = await this.quizRepository.findOne({
        where: { id: data.quizId, schoolId: data.schoolId },
      });

      if (!quiz) {
        throw new NotFoundException('Quiz not found for AI generation job');
      }

      const existingCount = await this.questionRepository.count({
        where: { schoolId: data.schoolId, quizId: data.quizId },
      });

      const persisted: Question[] = [];

      for (const [index, generated] of validated.entries()) {
        const question = this.questionRepository.create({
          schoolId: data.schoolId,
          quizId: data.quizId,
          questionText: generated.question_text,
          options: [...generated.options],
          correctOptionIndex: generated.correct_option_index,
          explanation: generated.explanation,
          orderIndex: existingCount + index,
          subject: task.subject,
          topic: task.topic,
          board: task.board,
          grade: task.grade,
          sourceType: QuestionSourceType.AI_GENERATED,
          aiModelUsed: llmResult.model,
          generatedByUserId: data.requestedByUserId,
          aiPromptSnapshot: task.prompt,
          aiGenerationTaskId: task.id,
        });
        persisted.push(await this.questionRepository.save(question));
      }

      await this.taskRepository.update(task.id, {
        status: AiGenerationStatus.COMPLETED,
        completedCount: persisted.length,
        failedCount: Math.max(0, task.requestedCount - persisted.length),
        aiModelUsed: llmResult.model,
        completedAt: new Date(),
        metrics: {
          llmLatencyMs: llmResult.latencyMs,
          parseDurationMs,
          validationErrors: 0,
          questionsPersisted: persisted.length,
          mockModelVersion: MOCK_LLM_MODEL,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown AI generation error';
      await this.taskRepository.update(task.id, {
        status: AiGenerationStatus.FAILED,
        failedCount: task.requestedCount,
        errorMessage: message,
        completedAt: new Date(),
        metrics: {
          parseDurationMs: Date.now() - parseStarted,
          validationErrors: 1,
          questionsPersisted: 0,
        },
      });
      throw error;
    }
  }

  private async markProcessing(taskId: string): Promise<void> {
    await this.taskRepository.update(taskId, {
      status: AiGenerationStatus.PROCESSING,
      startedAt: new Date(),
    });
  }

  private async assertQuizInTenant(tenant: TenantContext, quizId: string): Promise<Quiz> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const quiz = await this.quizRepository.findOne({ where: { id: quizId, schoolId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    assertQuizManageAccess(tenant, quiz);
    return quiz;
  }
}
