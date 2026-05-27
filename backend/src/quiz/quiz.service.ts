import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';
import { Class } from '@database/entities/class.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';
import { QuizStatus } from '@database/enums/quiz-status.enum';
import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { SchoolAcademicsService } from '../school-admin/school-academics.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { DashboardAnalyticsQueryDto } from './dto/dashboard-analytics-query.dto';
import { PublishQuizDto } from './dto/publish-quiz.dto';
import {
  isQuizVisibleToStudent,
  normalizeAudienceTargets,
  QuizAudienceTarget,
} from './quiz-audience.util';
import { mapQuizCreator } from './quiz-creator.util';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(StudentResponse)
    private readonly responseRepository: Repository<StudentResponse>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tenantContextService: TenantContextService,
    private readonly schoolAcademicsService: SchoolAcademicsService,
  ) {}

  async create(tenant: TenantContext, dto: CreateQuizDto): Promise<Quiz> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);

    if (!dto.grade && !dto.classId) {
      throw new BadRequestException('grade or classId is required');
    }

    await this.assertQuizAcademicsForSchool(schoolId, dto.grade, dto.subject);

    const classId = dto.grade
      ? await this.resolveClassForGrade(schoolId, dto.grade, tenant.userId)
      : dto.classId!;

    if (!dto.grade) {
      await this.assertClassInTenant(schoolId, classId);
    }

    const quiz = this.quizRepository.create({
      schoolId,
      classId,
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

  async listForTeacher(tenant: TenantContext, filters: DashboardAnalyticsQueryDto = {}) {
    const schoolIds = this.tenantContextService.resolveSchoolIdsForQuery(tenant);
    const multiSchool = schoolIds.length > 1;

    const where: {
      schoolId: ReturnType<typeof In>;
      createdByUserId?: string;
      grade?: string;
      subject?: string;
      board?: string;
      topic?: string;
    } = { schoolId: In(schoolIds) };

    if (filters.createdByUserId?.trim()) {
      where.createdByUserId = filters.createdByUserId.trim();
    }
    if (filters.grade?.trim()) where.grade = filters.grade.trim();
    if (filters.subject?.trim()) where.subject = filters.subject.trim();
    if (filters.board?.trim()) where.board = filters.board.trim();
    if (filters.topic?.trim()) where.topic = filters.topic.trim();

    const quizzes = await this.quizRepository.find({
      where,
      relations: ['class', 'questions', 'school', 'createdBy'],
      order: { createdAt: 'DESC' },
    });

    const quizIds = quizzes.map((q) => q.id);
    const avgRows =
      quizIds.length > 0
        ? await this.responseRepository
            .createQueryBuilder('r')
            .select('r.quiz_id', 'quizId')
            .addSelect(
              'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
              'avgAccuracy',
            )
            .where('r.quiz_id IN (:...quizIds)', { quizIds })
            .andWhere('r.school_id IN (:...schoolIds)', { schoolIds })
            .groupBy('r.quiz_id')
            .getRawMany<{ quizId: string; avgAccuracy: string }>()
        : [];

    const avgByQuiz = new Map(
      avgRows.map((r) => [r.quizId, Number(r.avgAccuracy)]),
    );

    return quizzes.map((quiz) => this.toQuizListItem(quiz, multiSchool, avgByQuiz.get(quiz.id) ?? null));
  }

  async update(tenant: TenantContext, quizId: string, dto: UpdateQuizDto) {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, schoolId },
      relations: ['questions'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    await this.assertQuizAcademicsForSchool(
      schoolId,
      dto.grade,
      dto.subject,
    );

    if (dto.classId && dto.classId !== quiz.classId) {
      await this.assertClassInTenant(schoolId, dto.classId);
      quiz.classId = dto.classId;
    }

    if (dto.title !== undefined) quiz.title = dto.title;
    if (dto.description !== undefined) quiz.description = dto.description ?? null;
    if (dto.subject !== undefined) quiz.subject = dto.subject ?? null;
    if (dto.topic !== undefined) quiz.topic = dto.topic ?? null;
    if (dto.board !== undefined) quiz.board = dto.board ?? null;
    if (dto.grade !== undefined) {
      quiz.grade = dto.grade ?? null;
      if (dto.grade) {
        quiz.classId = await this.resolveClassForGrade(
          schoolId,
          dto.grade,
          tenant.userId,
        );
      }
    }
    if (dto.timeLimitMinutes !== undefined) {
      quiz.timeLimitMinutes = dto.timeLimitMinutes ?? null;
    }
    if (dto.totalXpReward !== undefined) quiz.totalXpReward = dto.totalXpReward;

    await this.quizRepository.save(quiz);

    return {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      status: quiz.status,
      subject: quiz.subject,
      topic: quiz.topic,
      board: quiz.board,
      grade: quiz.grade,
      classId: quiz.classId,
      questionCount: quiz.questions?.length ?? 0,
      publishedAt: quiz.publishedAt,
    };
  }

  async unpublish(tenant: TenantContext, quizId: string) {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, schoolId },
      relations: ['questions'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.status !== QuizStatus.PUBLISHED) {
      throw new BadRequestException('Only published quizzes can be unpublished');
    }

    quiz.status = QuizStatus.DRAFT;
    quiz.publishedAt = null;
    await this.quizRepository.save(quiz);

    return {
      id: quiz.id,
      status: quiz.status,
      publishedAt: quiz.publishedAt,
      questionCount: quiz.questions?.length ?? 0,
    };
  }

  async publish(tenant: TenantContext, quizId: string, dto: PublishQuizDto) {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, schoolId },
      relations: ['questions', 'class'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (quiz.status === QuizStatus.PUBLISHED) {
      throw new BadRequestException('Quiz is already published');
    }

    if (!quiz.questions?.length) {
      throw new BadRequestException('Add at least one question before publishing');
    }

    const { scope, targets } = await this.resolvePublishAudience(schoolId, dto);

    quiz.audienceScope = scope;
    quiz.audienceTargets = targets;
    quiz.status = QuizStatus.PUBLISHED;
    quiz.publishedAt = new Date();
    await this.quizRepository.save(quiz);

    return {
      id: quiz.id,
      status: quiz.status,
      publishedAt: quiz.publishedAt,
      questionCount: quiz.questions.length,
      audienceScope: quiz.audienceScope,
      audienceTargets: quiz.audienceTargets,
    };
  }

  async getTeacherDashboard(
    tenant: TenantContext,
    filters: DashboardAnalyticsQueryDto = {},
  ) {
    const schoolIds = this.tenantContextService.resolveSchoolIdsForQuery(tenant);
    const filterOptions = await this.loadAnalyticsFilterOptions(schoolIds);
    const hasFilters = this.hasAnalyticsFilters(filters);

    let totalStudents: number;
    if (hasFilters) {
      const studentRow = await this.buildFilteredResponseQuery(schoolIds, filters)
        .select('COUNT(DISTINCT r.student_id)', 'cnt')
        .getRawOne<{ cnt: string }>();
      totalStudents = Number(studentRow?.cnt ?? 0);
    } else {
      totalStudents = await this.usersRepository.count({
        where: { schoolId: In(schoolIds), role: UserRole.STUDENT, isActive: true },
      });
    }

    const quizWhere: {
      schoolId: ReturnType<typeof In>;
      status: QuizStatus;
      createdByUserId?: string;
      grade?: string;
      subject?: string;
      board?: string;
      topic?: string;
    } = { schoolId: In(schoolIds), status: QuizStatus.PUBLISHED };
    if (filters.createdByUserId?.trim()) {
      quizWhere.createdByUserId = filters.createdByUserId.trim();
    }
    if (filters.grade?.trim()) quizWhere.grade = filters.grade.trim();
    if (filters.subject?.trim()) quizWhere.subject = filters.subject.trim();
    if (filters.board?.trim()) quizWhere.board = filters.board.trim();
    if (filters.topic?.trim()) quizWhere.topic = filters.topic.trim();

    const quizzesConducted = await this.quizRepository.count({ where: quizWhere });

    const avgRow = await this.buildFilteredResponseQuery(schoolIds, filters)
      .select(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'avgAccuracy',
      )
      .getRawOne<{ avgAccuracy: string | null }>();

    const topScoreRow = await this.buildFilteredResponseQuery(schoolIds, filters)
      .select(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'score',
      )
      .addSelect('r.student_id', 'studentId')
      .groupBy('r.student_id')
      .orderBy('score', 'DESC')
      .limit(1)
      .getRawOne<{ score: string }>();

    const recentQuizzes = await this.listForTeacher(tenant, filters);

    const topStudentQb = this.usersRepository
      .createQueryBuilder('u')
      .select('u.id', 'userId')
      .addSelect("COALESCE(u.display_name, u.first_name || ' ' || u.last_name)", 'name')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(r.id), 0), 0)',
        'score',
      )
      .where('u.school_id IN (:...schoolIds)', { schoolIds })
      .andWhere('u.role = :role', { role: UserRole.STUDENT })
      .andWhere('u.is_active = true');

    if (hasFilters) {
      topStudentQb
        .innerJoin(StudentResponse, 'r', 'r.student_id = u.id AND r.school_id = u.school_id')
        .innerJoin(Quiz, 'quiz', 'quiz.id = r.quiz_id');
      this.applyAnalyticsQuizFilters(topStudentQb, 'quiz', filters);
    } else {
      topStudentQb.leftJoin(
        StudentResponse,
        'r',
        'r.student_id = u.id AND r.school_id = u.school_id',
      );
    }

    const topStudentRows = await topStudentQb
      .groupBy('u.id, u.display_name, u.first_name, u.last_name')
      .orderBy('u.xp_points', 'DESC')
      .limit(5)
      .getRawMany<{ userId: string; name: string; score: string | null }>();

    const topWithScores = topStudentRows.map((s, index) => ({
      rank: index + 1,
      name: s.name,
      score: `${s.score ?? 0}%`,
    }));

    const quizPerformance = recentQuizzes
      .filter((q) => q.status === QuizStatus.PUBLISHED && q.avgAccuracy != null)
      .slice(0, 5)
      .map((q, i) => ({
        label: q.title.length > 14 ? `Q${i + 1}` : q.title,
        value: q.avgAccuracy ?? 0,
      }));

    const topicQb = this.buildFilteredResponseQuery(schoolIds, filters)
      .select('COALESCE(quiz.topic, quiz.subject, \'General\')', 'topic')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'percentage',
      )
      .groupBy('quiz.topic, quiz.subject')
      .orderBy('percentage', 'DESC')
      .limit(5);

    const topicRows = await topicQb.getRawMany<{ topic: string; percentage: string }>();

    const creatorPerformance = await this.loadCreatorPerformance(schoolIds, filters);

    return {
      schoolFilter: {
        schoolCount: schoolIds.length,
        schoolIds,
      },
      filterOptions,
      appliedFilters: {
        grade: filters.grade?.trim() || null,
        subject: filters.subject?.trim() || null,
        board: filters.board?.trim() || null,
        topic: filters.topic?.trim() || null,
        createdByUserId: filters.createdByUserId?.trim() || null,
      },
      stats: {
        totalStudents,
        quizzesConducted,
        avgAccuracy: Number(avgRow?.avgAccuracy ?? 0),
        topScore: topScoreRow ? `${topScoreRow.score}%` : '—',
      },
      recentQuizzes: recentQuizzes.slice(0, 8),
      topStudents: topWithScores,
      quizPerformance,
      topicPerformance: topicRows.map((t) => ({
        topic: t.topic,
        percentage: Number(t.percentage),
      })),
      creatorPerformance,
    };
  }

  async resolveCreatorForUser(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    return mapQuizCreator(user);
  }

  async findOne(tenant: TenantContext, quizId: string): Promise<Quiz> {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId, schoolId },
      relations: ['questions', 'createdBy'],
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  private async resolveClassForGrade(
    schoolId: string,
    grade: string,
    teacherId: string,
  ): Promise<string> {
    const existing = await this.classRepository.findOne({
      where: { schoolId, grade, isActive: true },
    });
    if (existing) {
      return existing.id;
    }

    const year = new Date().getFullYear();
    const created = this.classRepository.create({
      schoolId,
      name: grade,
      grade,
      section: null,
      academicYear: `${year}-${year + 1}`,
      homeroomTeacherId: teacherId,
      isActive: true,
    });

    const saved = await this.classRepository.save(created);
    return saved.id;
  }

  private buildFilteredResponseQuery(
    schoolIds: string[],
    filters: DashboardAnalyticsQueryDto,
  ): SelectQueryBuilder<StudentResponse> {
    const qb = this.responseRepository
      .createQueryBuilder('r')
      .innerJoin(Quiz, 'quiz', 'quiz.id = r.quiz_id')
      .where('r.school_id IN (:...schoolIds)', { schoolIds });
    this.applyAnalyticsQuizFilters(qb, 'quiz', filters);
    return qb;
  }

  private applyAnalyticsQuizFilters(
    qb: SelectQueryBuilder<ObjectLiteral>,
    quizAlias: string,
    filters: DashboardAnalyticsQueryDto,
  ): void {
    if (filters.grade?.trim()) {
      qb.andWhere(`${quizAlias}.grade = :grade`, { grade: filters.grade.trim() });
    }
    if (filters.subject?.trim()) {
      qb.andWhere(`${quizAlias}.subject = :subject`, { subject: filters.subject.trim() });
    }
    if (filters.board?.trim()) {
      qb.andWhere(`${quizAlias}.board = :board`, { board: filters.board.trim() });
    }
    if (filters.topic?.trim()) {
      qb.andWhere(`${quizAlias}.topic = :topic`, { topic: filters.topic.trim() });
    }
    if (filters.createdByUserId?.trim()) {
      qb.andWhere(`${quizAlias}.created_by_user_id = :createdByUserId`, {
        createdByUserId: filters.createdByUserId.trim(),
      });
    }
  }

  private async resolvePublishAudience(
    schoolId: string,
    dto: PublishQuizDto,
  ): Promise<{ scope: QuizAudienceScope; targets: QuizAudienceTarget[] }> {
    if (dto.audienceScope === QuizAudienceScope.SCHOOL) {
      return { scope: QuizAudienceScope.SCHOOL, targets: [] };
    }

    const targets = normalizeAudienceTargets(dto.targets);
    if (targets.length === 0) {
      throw new BadRequestException(
        'Select at least one grade and section when publishing to specific classes',
      );
    }

    await this.assertAudienceTargetsForSchool(schoolId, targets);
    return { scope: QuizAudienceScope.GRADE_SECTION, targets };
  }

  private async assertAudienceTargetsForSchool(
    schoolId: string,
    targets: QuizAudienceTarget[],
  ): Promise<void> {
    const options = await this.schoolAcademicsService.getForSchoolId(schoolId);
    for (const target of targets) {
      if (!options.grades.includes(target.grade)) {
        throw new BadRequestException(
          `Grade "${target.grade}" is not configured for this school`,
        );
      }
      if (!options.sections.includes(target.section)) {
        throw new BadRequestException(
          `Section "${target.section}" is not configured for this school`,
        );
      }
    }
  }

  private hasAnalyticsFilters(filters: DashboardAnalyticsQueryDto): boolean {
    return !!(
      filters.grade?.trim() ||
      filters.subject?.trim() ||
      filters.board?.trim() ||
      filters.topic?.trim() ||
      filters.createdByUserId?.trim()
    );
  }

  private toQuizListItem(
    quiz: Quiz,
    multiSchool: boolean,
    avgAccuracy: number | null,
  ) {
    return {
      id: quiz.id,
      schoolId: quiz.schoolId,
      schoolName: multiSchool ? (quiz.school?.name ?? null) : null,
      title: quiz.title,
      status: quiz.status,
      subject: quiz.subject,
      topic: quiz.topic,
      board: quiz.board,
      grade: quiz.grade,
      classId: quiz.classId,
      className: quiz.class?.name ?? null,
      questionCount: quiz.questions?.length ?? 0,
      avgAccuracy,
      createdBy: mapQuizCreator(quiz.createdBy),
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt,
      publishedAt: quiz.publishedAt,
      audienceScope: quiz.audienceScope,
      audienceTargets: normalizeAudienceTargets(quiz.audienceTargets),
      classSection: quiz.class?.section ?? null,
    };
  }

  private async loadCreatorPerformance(
    schoolIds: string[],
    filters: DashboardAnalyticsQueryDto,
  ) {
    const qb = this.quizRepository
      .createQueryBuilder('q')
      .innerJoin('q.createdBy', 'creator')
      .leftJoin(
        StudentResponse,
        'r',
        'r.quiz_id = q.id AND r.school_id = q.school_id',
      )
      .select('creator.id', 'userId')
      .addSelect(
        "COALESCE(NULLIF(TRIM(creator.display_name), ''), TRIM(creator.first_name || ' ' || creator.last_name), creator.email)",
        'creator_display_name',
      )
      .addSelect('creator.role', 'role')
      .addSelect('COUNT(DISTINCT q.id)', 'quiz_count')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN q.status = :published THEN q.id END)',
        'published_count',
      )
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(r.id), 0), 0)',
        'avg_accuracy',
      )
      .where('q.school_id IN (:...schoolIds)', { schoolIds })
      .andWhere('creator.role IN (:...creatorRoles)', {
        creatorRoles: [UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN],
      })
      .setParameter('published', QuizStatus.PUBLISHED)
      .groupBy(
        'creator.id, creator.display_name, creator.first_name, creator.last_name, creator.email, creator.role',
      )
      .orderBy('quiz_count', 'DESC');

    this.applyAnalyticsQuizFilters(qb, 'q', filters);

    const rows = await qb.getRawMany<{
      userId: string;
      creator_display_name: string;
      role: UserRole;
      quiz_count: string;
      published_count: string;
      avg_accuracy: string | null;
    }>();

    return rows.map((row) => ({
      userId: row.userId,
      displayName: row.creator_display_name,
      role: row.role,
      quizCount: Number(row.quiz_count),
      publishedCount: Number(row.published_count),
      avgAccuracy: row.avg_accuracy != null ? Number(row.avg_accuracy) : null,
    }));
  }

  private async loadAnalyticsFilterOptions(schoolIds: string[]) {
    const base = this.quizRepository
      .createQueryBuilder('q')
      .where('q.school_id IN (:...schoolIds)', { schoolIds });

    const [grades, subjects, boards, topics] = await Promise.all([
      base
        .clone()
        .select('DISTINCT q.grade', 'value')
        .andWhere('q.grade IS NOT NULL')
        .orderBy('q.grade', 'ASC')
        .getRawMany<{ value: string }>(),
      base
        .clone()
        .select('DISTINCT q.subject', 'value')
        .andWhere('q.subject IS NOT NULL')
        .orderBy('q.subject', 'ASC')
        .getRawMany<{ value: string }>(),
      base
        .clone()
        .select('DISTINCT q.board', 'value')
        .andWhere('q.board IS NOT NULL')
        .orderBy('q.board', 'ASC')
        .getRawMany<{ value: string }>(),
      base
        .clone()
        .select('DISTINCT q.topic', 'value')
        .andWhere('q.topic IS NOT NULL')
        .orderBy('q.topic', 'ASC')
        .getRawMany<{ value: string }>(),
    ]);

    const creators = await this.quizRepository
      .createQueryBuilder('q')
      .innerJoin('q.createdBy', 'u')
      .select('u.id', 'userId')
      .addSelect(
        "COALESCE(NULLIF(TRIM(u.display_name), ''), TRIM(u.first_name || ' ' || u.last_name), u.email)",
        'creator_display_name',
      )
      .addSelect('u.role', 'role')
      .where('q.school_id IN (:...schoolIds)', { schoolIds })
      .andWhere('u.role IN (:...creatorRoles)', {
        creatorRoles: [UserRole.TEACHER, UserRole.SCHOOL_ADMIN, UserRole.SUPER_ADMIN],
      })
      .groupBy('u.id, u.display_name, u.first_name, u.last_name, u.email, u.role')
      .orderBy('creator_display_name', 'ASC')
      .getRawMany<{ userId: string; creator_display_name: string; role: UserRole }>();

    return {
      grades: grades.map((r) => r.value),
      subjects: subjects.map((r) => r.value),
      boards: boards.map((r) => r.value),
      topics: topics.map((r) => r.value),
      creators: creators.map((c) => ({
        userId: c.userId,
        displayName: c.creator_display_name,
        role: c.role,
      })),
    };
  }

  private async assertClassInTenant(schoolId: string, classId: string): Promise<void> {
    const classEntity = await this.classRepository.findOne({
      where: { id: classId, schoolId },
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found in this school tenant');
    }
  }

  private async assertQuizAcademicsForSchool(
    schoolId: string,
    grade?: string,
    subject?: string,
  ): Promise<void> {
    if (!grade?.trim() && !subject?.trim()) {
      return;
    }
    const options = await this.schoolAcademicsService.getForSchoolId(schoolId);
    if (grade?.trim() && !options.grades.includes(grade.trim())) {
      throw new BadRequestException(
        `Grade must be one of your school's configured options`,
      );
    }
    if (subject?.trim() && !options.subjects.includes(subject.trim())) {
      throw new BadRequestException(
        `Subject must be one of your school's configured options`,
      );
    }
  }
}
