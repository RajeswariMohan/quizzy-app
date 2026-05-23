import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '@database/entities/class.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { CreateQuizDto } from './dto/create-quiz.dto';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async create(tenant: TenantContext, dto: CreateQuizDto): Promise<Quiz> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    await this.assertClassInTenant(schoolId, dto.classId);

    const quiz = this.quizRepository.create({
      schoolId,
      classId: dto.classId,
      createdByUserId: tenant.userId,
      title: dto.title,
      description: dto.description ?? null,
      subject: dto.subject ?? null,
      topic: dto.topic ?? null,
      board: dto.board ?? null,
      grade: dto.grade ?? null,
      timeLimitMinutes: dto.timeLimitMinutes ?? null,
      totalXpReward: dto.totalXpReward ?? 0,
      status: QuizStatus.DRAFT,
    });

    return this.quizRepository.save(quiz);
  }

  async findOne(tenant: TenantContext, quizId: string): Promise<Quiz> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, schoolId },
      relations: ['questions'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  private async assertClassInTenant(schoolId: string, classId: string): Promise<void> {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId, schoolId },
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found in this school tenant');
    }
  }
}
