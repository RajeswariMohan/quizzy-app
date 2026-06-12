import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { UserSession } from '@database/entities/user-session.entity';
import { User } from '@database/entities/user.entity';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { ParentStudentLinkService } from '../parent/parent-student-link.service';
import { applyUserSectionFilter } from '../school-admin/academic-section-filter.util';
import { ProgressStudentsQueryDto } from './dto/progress-students-query.dto';

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(StudentResponse)
    private readonly responseRepository: Repository<StudentResponse>,
    @InjectRepository(UserSession)
    private readonly sessionsRepository: Repository<UserSession>,
    private readonly tenantContextService: TenantContextService,
    private readonly parentStudentLinkService: ParentStudentLinkService,
  ) {}

  async listStudents(tenant: TenantContext, query: ProgressStudentsQueryDto) {
    const schoolId = this.requireSchoolId(tenant);

    if (tenant.role === UserRole.PARENT) {
      const linked = await this.parentStudentLinkService.listLinkedStudents(
        tenant.userId,
        schoolId,
      );
      const sessionStats = await this.loadSessionStatsMap(linked.map((s) => s.id));
      const items = await Promise.all(
        linked.map((student) =>
          this.buildStudentProgressRow(student, schoolId, sessionStats.get(student.id)),
        ),
      );
      return { items, total: items.length };
    }

    const qb = this.usersRepository
      .createQueryBuilder('u')
      .where('u.school_id = :schoolId', { schoolId })
      .andWhere('u.role = :role', { role: UserRole.STUDENT })
      .andWhere('u.is_active = true')
      .orderBy('u.last_name', 'ASC')
      .addOrderBy('u.first_name', 'ASC');

    if (tenant.role === UserRole.TEACHER) {
      qb.andWhere(
        `EXISTS (
          SELECT 1
          FROM student_responses r
          INNER JOIN quizzes q
            ON q.id = r.quiz_id
           AND q.school_id = r.school_id
          WHERE r.student_id = u.id
            AND r.school_id = :schoolId
            AND q.created_by_user_id = :teacherUserId
        )`,
        { schoolId, teacherUserId: tenant.userId },
      );
    }

    if (query.grade?.trim()) {
      qb.andWhere('u.grade = :grade', { grade: query.grade.trim() });
    }
    if (query.section?.trim()) {
      applyUserSectionFilter(qb, 'u', query.section.trim(), query.grade?.trim());
    }
    if (query.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(u.email) LIKE :term OR LOWER(u.first_name) LIKE :term OR LOWER(u.last_name) LIKE :term OR LOWER(COALESCE(u.display_name, '')) LIKE :term)`,
        { term },
      );
    }

    const students = await qb.getMany();
    const sessionStats = await this.loadSessionStatsMap(
      students.map((s) => s.id),
    );
    const items = await Promise.all(
      students.map((student) =>
        this.buildStudentProgressRow(student, schoolId, sessionStats.get(student.id)),
      ),
    );

    return { items, total: items.length };
  }

  async getStudentOverview(tenant: TenantContext, studentId: string) {
    const schoolId = this.requireSchoolId(tenant);
    const student = await this.authorizeStudent(tenant, schoolId, studentId);
    const stats = await this.loadResponseStats(student.id, schoolId);
    const topicMastery = await this.loadTopicMastery(student.id, schoolId);
    const performanceOverTime = await this.loadPerformanceOverTime(student.id, schoolId);
    const level = Math.floor(student.xpPoints / 500) + 1;

    return {
      student: this.toStudentProfile(student, level),
      stats,
      topicMastery,
      performanceOverTime,
    };
  }

  async listStudentQuizzes(tenant: TenantContext, studentId: string) {
    const schoolId = this.requireSchoolId(tenant);
    const student = await this.authorizeStudent(tenant, schoolId, studentId);

    const quizzes = await this.quizRepository.find({
      where: { schoolId, status: QuizStatus.PUBLISHED },
      relations: ['class'],
      order: { publishedAt: 'DESC' },
    });

    const responses = await this.responseRepository.find({
      where: { schoolId, studentId: student.id },
    });

    const responsesByQuiz = new Map<string, StudentResponse[]>();
    for (const response of responses) {
      const list = responsesByQuiz.get(response.quizId) ?? [];
      list.push(response);
      responsesByQuiz.set(response.quizId, list);
    }

    const questionCounts = await this.loadQuestionCounts(quizzes.map((q) => q.id));

    const items = await Promise.all(
      quizzes.map(async (quiz) => {
        const questionCount = questionCounts.get(quiz.id) ?? 0;
        const quizResponses = responsesByQuiz.get(quiz.id) ?? [];
        return this.buildQuizProgressRow(quiz, questionCount, quizResponses);
      }),
    );

    return {
      student: this.toStudentProfile(student),
      items: items.filter((row) => row.answeredCount > 0),
    };
  }

  async getStudentQuizDetail(
    tenant: TenantContext,
    studentId: string,
    quizId: string,
  ) {
    const schoolId = this.requireSchoolId(tenant);
    const student = await this.authorizeStudent(tenant, schoolId, studentId);

    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, schoolId, status: QuizStatus.PUBLISHED },
      relations: ['class'],
    });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const questions = await this.questionRepository.find({
      where: { schoolId, quizId },
      order: { orderIndex: 'ASC' },
    });

    const responses = await this.responseRepository.find({
      where: { schoolId, studentId: student.id, quizId },
    });
    const responseByQuestion = new Map(responses.map((r) => [r.questionId, r]));

    const summary = this.summarizeResponses(questions.length, responses);

    return {
      student: this.toStudentProfile(student),
      quiz: {
        id: quiz.id,
        title: quiz.title,
        subject: quiz.subject,
        topic: quiz.topic,
        board: quiz.board,
        grade: quiz.grade,
        className: quiz.class?.name ?? null,
        timeLimitMinutes: quiz.timeLimitMinutes,
        questionCount: questions.length,
        publishedAt: quiz.publishedAt?.toISOString() ?? null,
      },
      summary,
      questions: questions.map((q) => {
        const response = responseByQuestion.get(q.id);
        return {
          questionId: q.id,
          orderIndex: q.orderIndex,
          questionText: q.questionText,
          points: q.points,
          selectedOptionIndex: response?.selectedOptionIndex ?? null,
          isCorrect: response?.isCorrect ?? null,
          pointsEarned: response?.pointsEarned ?? 0,
          answeredAt: response?.answeredAt?.toISOString() ?? null,
          timeSpentSeconds: response?.timeSpentSeconds ?? null,
        };
      }),
    };
  }

  private async authorizeStudent(
    tenant: TenantContext,
    schoolId: string,
    studentId: string,
  ): Promise<User> {
    if (tenant.role === UserRole.PARENT) {
      return this.parentStudentLinkService.resolveLinkedStudent(
        tenant.userId,
        schoolId,
        studentId,
      );
    }

    const student = await this.usersRepository.findOne({
      where: {
        id: studentId,
        schoolId,
        role: UserRole.STUDENT,
        isActive: true,
      },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    if (tenant.role === UserRole.TEACHER) {
      const related = await this.responseRepository
        .createQueryBuilder('r')
        .innerJoin(
          Quiz,
          'q',
          'q.id = r.quiz_id AND q.school_id = r.school_id',
        )
        .where('r.school_id = :schoolId', { schoolId })
        .andWhere('r.student_id = :studentId', { studentId })
        .andWhere('q.created_by_user_id = :teacherUserId', {
          teacherUserId: tenant.userId,
        })
        .limit(1)
        .getRawOne();

      if (!related) {
        throw new ForbiddenException(
          'Teachers can only view progress for students related to their quizzes',
        );
      }
    }

    return student;
  }

  private async buildStudentProgressRow(
    student: User,
    schoolId: string,
    sessionStats?: { totalActiveSeconds: number; sessionCount: number; lastLoginAt: string | null },
  ) {
    const stats = await this.loadResponseStats(student.id, schoolId);
    return {
      studentId: student.id,
      email: student.email,
      displayName:
        student.displayName ?? `${student.firstName} ${student.lastName}`.trim(),
      grade: student.grade,
      section: student.section,
      xpPoints: student.xpPoints,
      currentStreak: student.currentStreak,
      totalActiveSeconds: sessionStats?.totalActiveSeconds ?? 0,
      sessionCount: sessionStats?.sessionCount ?? 0,
      lastLoginAt: sessionStats?.lastLoginAt ?? null,
      ...stats,
    };
  }

  private async loadSessionStatsMap(studentIds: string[]) {
    const map = new Map<
      string,
      { totalActiveSeconds: number; sessionCount: number; lastLoginAt: string | null }
    >();
    if (studentIds.length === 0) {
      return map;
    }

    const rows = await this.sessionsRepository
      .createQueryBuilder('s')
      .select('s.user_id', 'userId')
      .addSelect('COALESCE(SUM(s.active_seconds), 0)', 'totalActiveSeconds')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .addSelect('MAX(s.started_at)', 'lastLoginAt')
      .where('s.user_id IN (:...studentIds)', { studentIds })
      .groupBy('s.user_id')
      .getRawMany<{
        userId: string;
        totalActiveSeconds: string;
        sessionCount: string;
        lastLoginAt: Date | null;
      }>();

    for (const row of rows) {
      map.set(row.userId, {
        totalActiveSeconds: Number(row.totalActiveSeconds),
        sessionCount: Number(row.sessionCount),
        lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : null,
      });
    }
    return map;
  }

  private async loadResponseStats(studentId: string, schoolId: string) {
    const row = await this.responseRepository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'totalAnswers')
      .addSelect('COUNT(DISTINCT r.quiz_id)', 'quizzesStarted')
      .addSelect('SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END)', 'correctAnswers')
      .addSelect('SUM(r.points_earned)', 'totalPointsEarned')
      .addSelect('MAX(r.answered_at)', 'lastActivityAt')
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .getRawOne<{
        totalAnswers: string;
        quizzesStarted: string;
        correctAnswers: string;
        totalPointsEarned: string;
        lastActivityAt: Date | null;
      }>();

    const quizzesStarted = Number(row?.quizzesStarted ?? 0);
    const totalAnswers = Number(row?.totalAnswers ?? 0);
    const correctAnswers = Number(row?.correctAnswers ?? 0);
    const accuracy =
      totalAnswers > 0 ? Math.round((100 * correctAnswers) / totalAnswers) : 0;

    const quizzesCompleted = await this.countCompletedQuizzes(studentId, schoolId);

    return {
      quizzesStarted,
      quizzesCompleted,
      totalAnswers,
      correctAnswers,
      accuracy,
      totalPointsEarned: Number(row?.totalPointsEarned ?? 0),
      lastActivityAt: row?.lastActivityAt
        ? new Date(row.lastActivityAt).toISOString()
        : null,
    };
  }

  private async countCompletedQuizzes(studentId: string, schoolId: string): Promise<number> {
    const rows = await this.responseRepository
      .createQueryBuilder('r')
      .innerJoin(Question, 'q', 'q.id = r.question_id AND q.quiz_id = r.quiz_id')
      .select('r.quiz_id', 'quizId')
      .addSelect('COUNT(DISTINCT r.question_id)', 'answered')
      .addSelect('COUNT(DISTINCT q.id)', 'total')
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .groupBy('r.quiz_id')
      .getRawMany<{ quizId: string; answered: string; total: string }>();

    return rows.filter((row) => Number(row.answered) >= Number(row.total) && Number(row.total) > 0)
      .length;
  }

  private async loadTopicMastery(studentId: string, schoolId: string) {
    const rows = await this.responseRepository
      .createQueryBuilder('r')
      .innerJoin(Question, 'q', 'q.id = r.question_id')
      .innerJoin(Quiz, 'quiz', 'quiz.id = r.quiz_id')
      .select('COALESCE(quiz.topic, quiz.subject, \'General\')', 'topic')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'percentage',
      )
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .groupBy('quiz.topic, quiz.subject')
      .orderBy('percentage', 'DESC')
      .limit(8)
      .getRawMany<{ topic: string; percentage: string }>();

    return rows.map((row) => ({
      topic: row.topic,
      percentage: Number(row.percentage),
    }));
  }

  private async loadPerformanceOverTime(studentId: string, schoolId: string) {
    const rows = await this.responseRepository
      .createQueryBuilder('r')
      .select("TO_CHAR(r.answered_at, 'Mon DD')", 'label')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'value',
      )
      .where('r.student_id = :studentId', { studentId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .andWhere("r.answered_at >= NOW() - INTERVAL '14 days'")
      .groupBy("TO_CHAR(r.answered_at, 'Mon DD')")
      .orderBy('MIN(r.answered_at)', 'ASC')
      .getRawMany<{ label: string; value: string }>();

    return rows.map((row) => ({
      label: row.label,
      value: Number(row.value),
    }));
  }

  private async loadQuestionCounts(quizIds: string[]): Promise<Map<string, number>> {
    if (quizIds.length === 0) return new Map();

    const rows = await this.questionRepository
      .createQueryBuilder('q')
      .select('q.quiz_id', 'quizId')
      .addSelect('COUNT(*)', 'total')
      .where('q.quiz_id IN (:...quizIds)', { quizIds })
      .groupBy('q.quiz_id')
      .getRawMany<{ quizId: string; total: string }>();

    return new Map(rows.map((row) => [row.quizId, Number(row.total)]));
  }

  private buildQuizProgressRow(
    quiz: Quiz,
    questionCount: number,
    responses: StudentResponse[],
  ) {
    const summary = this.summarizeResponses(questionCount, responses);
    return {
      quizId: quiz.id,
      title: quiz.title,
      subject: quiz.subject,
      topic: quiz.topic,
      board: quiz.board,
      grade: quiz.grade,
      className: quiz.class?.name ?? null,
      questionCount,
      ...summary,
    };
  }

  private summarizeResponses(questionCount: number, responses: StudentResponse[]) {
    const answeredCount = responses.length;
    const correctCount = responses.filter((r) => r.isCorrect).length;
    const pointsEarned = responses.reduce((sum, r) => sum + r.pointsEarned, 0);
    const accuracy =
      answeredCount > 0 ? Math.round((100 * correctCount) / answeredCount) : 0;
    const isComplete = questionCount > 0 && answeredCount >= questionCount;
    const answeredTimes = responses.map((r) => r.answeredAt.getTime());
    const timeSpent = responses.reduce(
      (sum, r) => sum + (r.timeSpentSeconds ?? 0),
      0,
    );

    return {
      answeredCount,
      correctCount,
      pointsEarned,
      accuracy,
      isComplete,
      firstAnsweredAt:
        answeredTimes.length > 0
          ? new Date(Math.min(...answeredTimes)).toISOString()
          : null,
      lastAnsweredAt:
        answeredTimes.length > 0
          ? new Date(Math.max(...answeredTimes)).toISOString()
          : null,
      totalTimeSpentSeconds: timeSpent > 0 ? timeSpent : null,
    };
  }

  private toStudentProfile(student: User, level?: number) {
    return {
      studentId: student.id,
      email: student.email,
      displayName:
        student.displayName ?? `${student.firstName} ${student.lastName}`.trim(),
      grade: student.grade,
      section: student.section,
      xpPoints: student.xpPoints,
      currentStreak: student.currentStreak,
      level: level ?? Math.floor(student.xpPoints / 500) + 1,
    };
  }

  private requireSchoolId(tenant: TenantContext): string {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    if (!schoolId) {
      throw new ForbiddenException('School context required');
    }
    return schoolId;
  }
}
