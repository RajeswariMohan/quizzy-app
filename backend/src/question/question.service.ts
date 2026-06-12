import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Question } from '@database/entities/question.entity';
import { QuestionSourceType } from '@database/enums/question-source-type.enum';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { Quiz } from '@database/entities/quiz.entity';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { assertQuizManageAccess } from '../quiz/quiz-access.util';
import { CreateManualQuestionDto } from './dto/create-manual-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    private readonly dataSource: DataSource,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async createManual(
    tenant: TenantContext,
    quizId: string,
    dto: CreateManualQuestionDto,
  ): Promise<Question> {
    await this.assertQuizInTenant(tenant, quizId);

    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const orderIndex =
      dto.orderIndex ??
      (await this.questionRepository.count({ where: { schoolId, quizId } }));

    const question = this.questionRepository.create({
      schoolId,
      quizId,
      questionText: dto.questionText.trim(),
      options: dto.options.map((o) => o.trim()),
      correctOptionIndex: dto.correctOptionIndex,
      explanation: dto.explanation?.trim() ?? null,
      orderIndex,
      difficulty: dto.difficulty ?? null,
      points: dto.points ?? 10,
      sourceType: QuestionSourceType.MANUAL,
      generatedByUserId: tenant.userId,
    });

    return this.questionRepository.save(question);
  }

  async bulkCreateManual(
    tenant: TenantContext,
    quizId: string,
    questions: CreateManualQuestionDto[],
  ): Promise<{ importedCount: number; questionIds: string[] }> {
    await this.assertQuizInTenant(tenant, quizId);

    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    let orderIndex = await this.questionRepository.count({
      where: { schoolId, quizId },
    });

    const saved: Question[] = [];
    for (const dto of questions) {
      const question = this.questionRepository.create({
        schoolId,
        quizId,
        questionText: dto.questionText.trim(),
        options: dto.options.map((o) => o.trim()),
        correctOptionIndex: dto.correctOptionIndex,
        explanation: dto.explanation?.trim() ?? null,
        orderIndex: dto.orderIndex ?? orderIndex,
        difficulty: dto.difficulty ?? null,
        points: dto.points ?? 10,
        sourceType: QuestionSourceType.MANUAL,
        generatedByUserId: tenant.userId,
      });
      saved.push(await this.questionRepository.save(question));
      orderIndex += 1;
    }

    return {
      importedCount: saved.length,
      questionIds: saved.map((q) => q.id),
    };
  }

  async update(
    tenant: TenantContext,
    quizId: string,
    questionId: string,
    dto: UpdateQuestionDto,
  ): Promise<Question> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    await this.assertDraftQuiz(tenant, quizId);

    const question = await this.questionRepository.findOne({
      where: { id: questionId, quizId, schoolId },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    question.questionText = dto.questionText.trim();
    question.options = dto.options.map((o) => o.trim());
    question.correctOptionIndex = dto.correctOptionIndex;
    question.explanation = dto.explanation?.trim() ?? null;
    if (dto.difficulty !== undefined) question.difficulty = dto.difficulty ?? null;
    if (dto.points !== undefined) question.points = dto.points;

    return this.questionRepository.save(question);
  }

  async remove(
    tenant: TenantContext,
    quizId: string,
    questionId: string,
  ): Promise<{ deleted: true; remainingCount: number }> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    await this.assertDraftQuiz(tenant, quizId);

    const question = await this.questionRepository.findOne({
      where: { id: questionId, quizId, schoolId },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.delete(Question, { id: questionId, quizId, schoolId });

      const remaining = await manager.find(Question, {
        where: { schoolId, quizId },
        order: { orderIndex: 'ASC' },
      });

      for (let i = 0; i < remaining.length; i++) {
        if (remaining[i].orderIndex !== i) {
          remaining[i].orderIndex = i;
          await manager.save(remaining[i]);
        }
      }
    });

    const remainingCount = await this.questionRepository.count({
      where: { schoolId, quizId },
    });

    return { deleted: true, remainingCount };
  }

  async listByQuiz(tenant: TenantContext, quizId: string): Promise<Question[]> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    await this.assertQuizInTenant(tenant, quizId);

    return this.questionRepository.find({
      where: { schoolId, quizId },
      order: { orderIndex: 'ASC' },
    });
  }

  private async assertQuizInTenant(tenant: TenantContext, quizId: string): Promise<void> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const quiz = await this.quizRepository.findOne({ where: { id: quizId, schoolId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    assertQuizManageAccess(tenant, quiz);
  }

  private async assertDraftQuiz(tenant: TenantContext, quizId: string): Promise<Quiz> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const quiz = await this.quizRepository.findOne({ where: { id: quizId, schoolId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    assertQuizManageAccess(tenant, quiz);
    if (quiz.status !== QuizStatus.DRAFT) {
      throw new BadRequestException(
        'Quiz must be unpublished (draft) before editing questions',
      );
    }
    return quiz;
  }
}
