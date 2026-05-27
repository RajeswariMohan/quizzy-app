import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import {
  isQuizVisibleToStudent,
  normalizeAudienceTargets,
} from '../quiz/quiz-audience.util';

@Injectable()
export class StudentQuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(StudentResponse)
    private readonly responseRepository: Repository<StudentResponse>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async listPublishedQuizzes(tenant: TenantContext) {
    const schoolId = this.requireSchoolId(tenant);

    const student = await this.usersRepository.findOne({
      where: { id: tenant.userId, schoolId, role: UserRole.STUDENT },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const allPublished = await this.quizRepository.find({
      where: { schoolId, status: QuizStatus.PUBLISHED },
      relations: ['class'],
      order: { publishedAt: 'DESC' },
    });

    const quizzes = allPublished.filter((quiz) =>
      isQuizVisibleToStudent(
        quiz.audienceScope,
        normalizeAudienceTargets(quiz.audienceTargets),
        student.grade,
        student.section,
      ),
    );

    const quizIds = quizzes.map((q) => q.id);
    const responseCounts =
      quizIds.length > 0
        ? await this.responseRepository
            .createQueryBuilder('r')
            .select('r.quiz_id', 'quizId')
            .addSelect('COUNT(*)', 'answered')
            .where('r.student_id = :studentId', { studentId: tenant.userId })
            .andWhere('r.quiz_id IN (:...quizIds)', { quizIds })
            .groupBy('r.quiz_id')
            .getRawMany<{ quizId: string; answered: string }>()
        : [];

    const answeredByQuiz = new Map(
      responseCounts.map((r) => [r.quizId, Number(r.answered)]),
    );

    const questionCounts =
      quizIds.length > 0
        ? await this.questionRepository
            .createQueryBuilder('q')
            .select('q.quiz_id', 'quizId')
            .addSelect('COUNT(*)', 'total')
            .where('q.quiz_id IN (:...quizIds)', { quizIds })
            .groupBy('q.quiz_id')
            .getRawMany<{ quizId: string; total: string }>()
        : [];

    const questionsByQuiz = new Map(
      questionCounts.map((q) => [q.quizId, Number(q.total)]),
    );

    return quizzes.map((quiz) => {
      const questionCount = questionsByQuiz.get(quiz.id) ?? 0;
      const answeredCount = answeredByQuiz.get(quiz.id) ?? 0;
      return {
        id: quiz.id,
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        className: quiz.class?.name ?? null,
        questionCount,
        answeredCount,
        isComplete: questionCount > 0 && answeredCount >= questionCount,
      };
    });
  }

  async getQuizForTaking(tenant: TenantContext, quizId: string) {
    const schoolId = this.requireSchoolId(tenant);
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, schoolId, status: QuizStatus.PUBLISHED },
    });

    if (!quiz || !(await this.canStudentAccessQuiz(tenant, quiz))) {
      throw new NotFoundException('Published quiz not found');
    }

    const questions = await this.questionRepository.find({
      where: { schoolId, quizId },
      order: { orderIndex: 'ASC' },
    });

    const responses = await this.responseRepository.find({
      where: { schoolId, studentId: tenant.userId, quizId },
    });

    const responseByQuestion = new Map(responses.map((r) => [r.questionId, r]));

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      subject: quiz.subject,
      topic: quiz.topic,
      timeLimitMinutes: quiz.timeLimitMinutes,
      questions: questions.map((q) => {
        const prior = responseByQuestion.get(q.id);
        return {
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          orderIndex: q.orderIndex,
          points: q.points,
          selectedOptionIndex: prior?.selectedOptionIndex ?? null,
          priorAnswer: prior
            ? {
                isCorrect: prior.isCorrect,
                pointsEarned: prior.pointsEarned,
                correctOptionIndex: q.correctOptionIndex,
                explanation: q.explanation,
              }
            : null,
        };
      }),
    };
  }

  async submitResponse(
    tenant: TenantContext,
    quizId: string,
    dto: SubmitResponseDto,
  ) {
    const schoolId = this.requireSchoolId(tenant);

    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, schoolId, status: QuizStatus.PUBLISHED },
    });
    if (!quiz || !(await this.canStudentAccessQuiz(tenant, quiz))) {
      throw new NotFoundException('Published quiz not found');
    }

    const question = await this.questionRepository.findOne({
      where: { id: dto.questionId, schoolId, quizId },
    });
    if (!question) {
      throw new NotFoundException('Question not found in this quiz');
    }

    const isCorrect = dto.selectedOptionIndex === question.correctOptionIndex;
    const pointsEarned = isCorrect ? question.points : 0;

    const existing = await this.responseRepository.findOne({
      where: {
        schoolId,
        studentId: tenant.userId,
        questionId: dto.questionId,
      },
    });

    const wasCorrectBefore = existing?.isCorrect ?? false;
    const previousPoints = existing?.pointsEarned ?? 0;

    const response = existing
      ? Object.assign(existing, {
          selectedOptionIndex: dto.selectedOptionIndex,
          isCorrect,
          pointsEarned,
          timeSpentSeconds: dto.timeSpentSeconds ?? existing.timeSpentSeconds,
          answeredAt: new Date(),
        })
      : this.responseRepository.create({
          schoolId,
          studentId: tenant.userId,
          quizId,
          questionId: dto.questionId,
          selectedOptionIndex: dto.selectedOptionIndex,
          isCorrect,
          pointsEarned,
          timeSpentSeconds: dto.timeSpentSeconds ?? null,
        });

    await this.responseRepository.save(response);

    const xpDelta = pointsEarned - previousPoints;
    if (xpDelta !== 0 || !wasCorrectBefore) {
      await this.applyXpAndStreak(tenant.userId, xpDelta);
    }

    return {
      questionId: dto.questionId,
      isCorrect,
      pointsEarned,
      correctOptionIndex: question.correctOptionIndex,
      explanation: question.explanation,
    };
  }

  async getProgress(tenant: TenantContext) {
    const schoolId = this.requireSchoolId(tenant);
    const user = await this.usersRepository.findOne({
      where: { id: tenant.userId, schoolId },
    });

    if (!user) {
      throw new NotFoundException('Student not found');
    }

    const stats = await this.responseRepository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'totalAnswers')
      .addSelect('COUNT(DISTINCT r.quiz_id)', 'quizzesTaken')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'accuracy',
      )
      .where('r.student_id = :studentId', { studentId: tenant.userId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .getRawOne<{
        totalAnswers: string;
        quizzesTaken: string;
        accuracy: string | null;
      }>();

    const topicRows = await this.responseRepository
      .createQueryBuilder('r')
      .innerJoin(Question, 'q', 'q.id = r.question_id')
      .innerJoin(Quiz, 'quiz', 'quiz.id = r.quiz_id')
      .select('COALESCE(quiz.topic, quiz.subject, \'General\')', 'topic')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'percentage',
      )
      .where('r.student_id = :studentId', { studentId: tenant.userId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .groupBy('quiz.topic, quiz.subject')
      .orderBy('percentage', 'DESC')
      .limit(6)
      .getRawMany<{ topic: string; percentage: string }>();

    const performanceRows = await this.responseRepository
      .createQueryBuilder('r')
      .select("TO_CHAR(r.answered_at, 'Dy')", 'label')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'value',
      )
      .where('r.student_id = :studentId', { studentId: tenant.userId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .andWhere('r.answered_at >= NOW() - INTERVAL \'7 days\'')
      .groupBy("TO_CHAR(r.answered_at, 'Dy')")
      .orderBy('MIN(r.answered_at)', 'ASC')
      .getRawMany<{ label: string; value: string }>();

    const level = Math.floor(user.xpPoints / 500) + 1;
    const xpInLevel = user.xpPoints % 500;
    const xpToNextLevel = 500;

    return {
      displayName:
        user.displayName ?? `${user.firstName} ${user.lastName}`.trim(),
      xpPoints: user.xpPoints,
      currentStreak: user.currentStreak,
      level,
      xpInLevel,
      xpToNextLevel,
      quizzesTaken: Number(stats?.quizzesTaken ?? 0),
      accuracy: Number(stats?.accuracy ?? 0),
      totalAnswers: Number(stats?.totalAnswers ?? 0),
      topicMastery: topicRows.map((t) => ({
        topic: t.topic,
        percentage: Number(t.percentage),
      })),
      performanceOverTime: performanceRows.map((p) => ({
        label: p.label,
        value: Number(p.value),
      })),
    };
  }

  async getLeaderboard(tenant: TenantContext) {
    const schoolId = this.requireSchoolId(tenant);

    const rows = await this.usersRepository
      .createQueryBuilder('u')
      .select('u.id', 'userId')
      .addSelect("COALESCE(u.display_name, u.first_name || ' ' || u.last_name)", 'name')
      .addSelect('u.xp_points', 'xp')
      .where('u.school_id = :schoolId', { schoolId })
      .andWhere('u.role = :role', { role: UserRole.STUDENT })
      .andWhere('u.is_active = true')
      .orderBy('u.xp_points', 'DESC')
      .limit(10)
      .getRawMany<{ userId: string; name: string; xp: string }>();

    const studentIds = rows.map((r) => r.userId);
    const accuracyRows =
      studentIds.length > 0
        ? await this.responseRepository
            .createQueryBuilder('r')
            .select('r.student_id', 'studentId')
            .addSelect(
              'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
              'score',
            )
            .where('r.student_id IN (:...studentIds)', { studentIds })
            .andWhere('r.school_id = :schoolId', { schoolId })
            .groupBy('r.student_id')
            .getRawMany<{ studentId: string; score: string }>()
        : [];

    const scoreByStudent = new Map(
      accuracyRows.map((r) => [r.studentId, Number(r.score)]),
    );

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      name: row.name,
      xp: Number(row.xp),
      score: scoreByStudent.get(row.userId) ?? 0,
      isCurrentUser: row.userId === tenant.userId,
    }));
  }

  private async applyXpAndStreak(userId: string, xpDelta: number): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) return;

    user.xpPoints = Math.max(0, user.xpPoints + xpDelta);

    const today = new Date().toISOString().slice(0, 10);
    const last = user.lastActivityDate;

    if (last === today) {
      // same day — streak unchanged
    } else if (last) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      user.currentStreak = last === yesterdayStr ? user.currentStreak + 1 : 1;
    } else {
      user.currentStreak = 1;
    }

    user.lastActivityDate = today;
    await this.usersRepository.save(user);
  }

  private async canStudentAccessQuiz(
    tenant: TenantContext,
    quiz: Quiz,
  ): Promise<boolean> {
    const schoolId = this.requireSchoolId(tenant);
    const student = await this.usersRepository.findOne({
      where: { id: tenant.userId, schoolId, role: UserRole.STUDENT },
    });
    if (!student) return false;
    return isQuizVisibleToStudent(
      quiz.audienceScope,
      normalizeAudienceTargets(quiz.audienceTargets),
      student.grade,
      student.section,
    );
  }

  private requireSchoolId(tenant: TenantContext): string {
    if (!tenant.schoolId) {
      throw new BadRequestException('Student must belong to a school tenant');
    }
    return tenant.schoolId;
  }
}
