import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '@database/entities/question.entity';
import { QuestionSourceType } from '@database/enums/question-source-type.enum';
import { Quiz } from '@database/entities/quiz.entity';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { CreateManualQuestionDto } from './dto/create-manual-question.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async createManual(
    tenant: TenantContext,
    quizId: string,
    dto: CreateManualQuestionDto,
  ): Promise<Question> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    await this.assertQuizInTenant(schoolId, quizId);

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

  async listByQuiz(tenant: TenantContext, quizId: string): Promise<Question[]> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    await this.assertQuizInTenant(schoolId, quizId);

    return this.questionRepository.find({
      where: { schoolId, quizId },
      order: { orderIndex: 'ASC' },
    });
  }

  private async assertQuizInTenant(schoolId: string, quizId: string): Promise<void> {
    const quiz = await this.quizRepository.findOne({ where: { id: quizId, schoolId } });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
  }
}
