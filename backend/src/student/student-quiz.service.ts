import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { SchoolFeatureService } from '../school/school-feature.service';
import { SubmitResponseDto } from './dto/submit-response.dto';
import {
  formatAudienceTargetsLabel,
  isQuizVisibleToStudent,
  normalizeAudienceTargets,
  quizMatchesPublishedAudienceFilter,
} from '../quiz/quiz-audience.util';
import {
  applyUserSectionFilter,
  isSeniorSecondaryGrade,
} from '../school-admin/academic-section-filter.util';
import { SchoolAcademicsService } from '../school-admin/school-academics.service';
import { StudentAudienceQueryDto } from './dto/student-audience-query.dto';
import {
  collectPublishedAudienceCatalog,
  isGradeInPublishedCatalog,
  isSectionInPublishedCatalog,
  PublishedAudienceCatalog,
} from './student-published-audience.util';

interface LeaderboardRow {
  userId: string;
  name: string;
  xp: string;
  grade: string | null;
  section: string | null;
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  score: number;
  grade: string | null;
  section: string | null;
  isCurrentUser: boolean;
}

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
    private readonly schoolFeatureService: SchoolFeatureService,
    private readonly schoolAcademicsService: SchoolAcademicsService,
  ) {}

  async getAudienceOptions(tenant: TenantContext) {
    const schoolId = this.requireSchoolId(tenant);
    const student = await this.requireStudent(tenant, schoolId);
    const catalog = await this.loadPublishedCatalog(schoolId);

    return {
      viewer: {
        grade: student.grade?.trim() || null,
        section: student.section?.trim() || null,
      },
      grades: catalog.grades,
      sectionsByGrade: catalog.sectionsByGrade,
      hasSchoolWidePublished: catalog.hasSchoolWidePublished,
    };
  }

  async listPublishedQuizzes(
    tenant: TenantContext,
    query: StudentAudienceQueryDto = {},
  ) {
    const schoolId = this.requireSchoolId(tenant);

    const student = await this.requireStudent(tenant, schoolId);
    const audienceFilter = await this.resolveAudienceFilter(schoolId, student, query);

    const allPublished = await this.quizRepository.find({
      where: { schoolId, status: QuizStatus.PUBLISHED },
      relations: ['class'],
      order: { publishedAt: 'DESC' },
    });

    let quizzes = allPublished.filter((quiz) =>
      isQuizVisibleToStudent(
        quiz.audienceScope,
        normalizeAudienceTargets(quiz.audienceTargets),
        student.grade,
        student.section,
      ),
    );

    if (audienceFilter) {
      quizzes = quizzes.filter((quiz) =>
        quizMatchesPublishedAudienceFilter(
          quiz.audienceScope,
          quiz.audienceTargets,
          audienceFilter,
        ),
      );
    }

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

    return {
      filter: audienceFilter,
      items: quizzes.map((quiz) => {
        const questionCount = questionsByQuiz.get(quiz.id) ?? 0;
        const answeredCount = answeredByQuiz.get(quiz.id) ?? 0;
        const targets = normalizeAudienceTargets(quiz.audienceTargets);
        return {
          id: quiz.id,
          title: quiz.title,
          subject: quiz.subject,
          topic: quiz.topic,
          className: quiz.class?.name ?? null,
          audienceScope: quiz.audienceScope,
          audienceLabel: formatAudienceTargetsLabel(targets),
          questionCount,
          answeredCount,
          isComplete: questionCount > 0 && answeredCount >= questionCount,
        };
      }),
    };
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

    if (existing) {
      throw new ConflictException(
        'This question was already answered and cannot be changed.',
      );
    }

    const response = this.responseRepository.create({
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

    const features = await this.schoolFeatureService.getEffectiveFeatures(schoolId);
    if (features.gamificationEnabled && pointsEarned > 0) {
      await this.applyXpAndStreak(tenant.userId, pointsEarned);
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

    const subjectPerformanceRows = await this.responseRepository
      .createQueryBuilder('r')
      .innerJoin(Quiz, 'quiz', 'quiz.id = r.quiz_id AND quiz.school_id = r.school_id')
      .select(
        "COALESCE(NULLIF(TRIM(quiz.subject), ''), 'General')",
        'subject',
      )
      .addSelect('COUNT(*)', 'answeredCount')
      .addSelect(
        'SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END)',
        'correctCount',
      )
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'score',
      )
      .where('r.student_id = :studentId', { studentId: tenant.userId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .groupBy("COALESCE(NULLIF(TRIM(quiz.subject), ''), 'General')")
      .orderBy('COUNT(*)', 'DESC')
      .limit(8)
      .getRawMany<{
        subject: string;
        answeredCount: string;
        correctCount: string;
        score: string;
      }>();

    const performanceRows = await this.responseRepository
      .createQueryBuilder('r')
      .select("TO_CHAR(r.answered_at, 'Mon DD')", 'label')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'value',
      )
      .where('r.student_id = :studentId', { studentId: tenant.userId })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .andWhere("r.answered_at >= NOW() - INTERVAL '14 days'")
      .groupBy("TO_CHAR(r.answered_at, 'Mon DD')")
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
      subjectPerformance: subjectPerformanceRows.map((row) => ({
        subject: row.subject,
        score: Number(row.score),
        answeredCount: Number(row.answeredCount),
        correctCount: Number(row.correctCount),
      })),
      performanceOverTime: performanceRows.map((p) => ({
        label: p.label,
        value: Number(p.value),
      })),
    };
  }

  async getLeaderboard(
    tenant: TenantContext,
    query: StudentAudienceQueryDto = {},
  ) {
    const schoolId = this.requireSchoolId(tenant);
    await this.schoolFeatureService.assertFeature(schoolId, 'studentLeaderboardEnabled');

    const viewer = await this.requireStudent(tenant, schoolId);
    const catalog = await this.loadPublishedCatalog(schoolId);
    const resolved = this.resolveLeaderboardFilter(viewer, catalog, query);

    if (!resolved) {
      return {
        viewer: {
          grade: viewer.grade?.trim() || null,
          section: viewer.section?.trim() || null,
        },
        profileComplete: Boolean(viewer.grade?.trim() && viewer.section?.trim()),
        options: {
          grades: catalog.grades,
          sectionsByGrade: catalog.sectionsByGrade,
          hasSchoolWidePublished: catalog.hasSchoolWidePublished,
        },
        filter: null,
        entries: [],
      };
    }

    this.assertFilterInCatalog(catalog, resolved);

    const rankingFilters: { grade: string; section?: string } = {
      grade: resolved.grade,
    };
    if (resolved.scope === 'section' && resolved.section) {
      rankingFilters.section = resolved.section;
    }

    const entries = await this.fetchLeaderboardRankings(
      schoolId,
      tenant.userId,
      rankingFilters,
    );

    return {
      viewer: {
        grade: viewer.grade?.trim() || null,
        section: viewer.section?.trim() || null,
      },
      profileComplete: Boolean(viewer.grade?.trim() && viewer.section?.trim()),
      options: {
        grades: catalog.grades,
        sectionsByGrade: catalog.sectionsByGrade,
        hasSchoolWidePublished: catalog.hasSchoolWidePublished,
      },
      filter: {
        grade: resolved.grade,
        scope: resolved.scope,
        section: resolved.section ?? null,
        headline: resolved.headline,
        description: resolved.description,
      },
      entries,
    };
  }

  private formatSectionHeadline(grade: string, section: string): string {
    if (isSeniorSecondaryGrade(grade) && section.includes(' · ')) {
      return `${grade} · ${section}`;
    }
    return `${grade} · Section ${section}`;
  }

  private async fetchLeaderboardRankings(
    schoolId: string,
    currentUserId: string,
    filters: { grade?: string; section?: string },
    limit = 10,
  ): Promise<LeaderboardEntryDto[]> {
    const qb = this.usersRepository
      .createQueryBuilder('u')
      .select('u.id', 'userId')
      .addSelect("COALESCE(u.display_name, u.first_name || ' ' || u.last_name)", 'name')
      .addSelect('u.xp_points', 'xp')
      .addSelect('u.grade', 'grade')
      .addSelect('u.section', 'section')
      .where('u.school_id = :schoolId', { schoolId })
      .andWhere('u.role = :role', { role: UserRole.STUDENT })
      .andWhere('u.is_active = true');

    if (filters.grade) {
      qb.andWhere('u.grade = :grade', { grade: filters.grade });
    }
    if (filters.section) {
      applyUserSectionFilter(qb, 'u', filters.section, filters.grade);
    }

    const rows = await qb
      .orderBy('u.xp_points', 'DESC')
      .limit(limit)
      .getRawMany<LeaderboardRow>();

    const studentIds = rows.map((r) => r.userId);
    const scoreByStudent =
      studentIds.length > 0
        ? await this.loadAccuracyByStudent(schoolId, studentIds)
        : new Map<string, number>();

    return rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      name: row.name,
      xp: Number(row.xp),
      score: scoreByStudent.get(row.userId) ?? 0,
      grade: row.grade,
      section: row.section,
      isCurrentUser: row.userId === currentUserId,
    }));
  }

  private async loadAccuracyByStudent(
    schoolId: string,
    studentIds: string[],
  ): Promise<Map<string, number>> {
    const accuracyRows = await this.responseRepository
      .createQueryBuilder('r')
      .select('r.student_id', 'studentId')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'score',
      )
      .where('r.student_id IN (:...studentIds)', { studentIds })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .groupBy('r.student_id')
      .getRawMany<{ studentId: string; score: string }>();

    return new Map(accuracyRows.map((r) => [r.studentId, Number(r.score)]));
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

  private async requireStudent(
    tenant: TenantContext,
    schoolId: string,
  ): Promise<User> {
    const student = await this.usersRepository.findOne({
      where: { id: tenant.userId, schoolId, role: UserRole.STUDENT },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  private async loadPublishedCatalog(
    schoolId: string,
  ): Promise<PublishedAudienceCatalog> {
    const [quizzes, academics] = await Promise.all([
      this.quizRepository.find({
        where: { schoolId, status: QuizStatus.PUBLISHED },
        select: ['audienceScope', 'audienceTargets'],
      }),
      this.schoolAcademicsService.getForSchoolId(schoolId),
    ]);
    return collectPublishedAudienceCatalog(quizzes, academics);
  }

  private assertClientEnrollmentMatchesViewer(
    viewer: User,
    query: StudentAudienceQueryDto,
  ): void {
    const viewerGrade = viewer.grade?.trim() || null;
    const viewerSection = viewer.section?.trim() || null;
    const gradeParam = query.grade?.trim();
    const sectionParam = query.section?.trim();

    if (gradeParam) {
      if (!viewerGrade) {
        throw new ForbiddenException(
          'Complete your grade on your profile before using class filters.',
        );
      }
      if (gradeParam !== viewerGrade) {
        throw new ForbiddenException(
          'You can only view content for your enrolled class.',
        );
      }
    }

    if (sectionParam) {
      if (!viewerSection) {
        throw new ForbiddenException(
          'Complete your section on your profile before using section filters.',
        );
      }
      if (sectionParam !== viewerSection) {
        throw new ForbiddenException(
          'You can only view content for your enrolled section.',
        );
      }
    }
  }

  private async resolveAudienceFilter(
    schoolId: string,
    student: User,
    query: StudentAudienceQueryDto,
  ): Promise<{ grade: string; section?: string } | null> {
    this.assertClientEnrollmentMatchesViewer(student, query);

    const gradeParam = query.grade?.trim();
    if (!gradeParam) {
      return null;
    }

    const catalog = await this.loadPublishedCatalog(schoolId);
    const scope = query.scope ?? (query.section?.trim() ? 'section' : 'class');
    const sectionParam = query.section?.trim();

    const filter: { grade: string; section?: string } = { grade: gradeParam };
    if (scope === 'section') {
      if (!sectionParam) {
        throw new BadRequestException(
          'Section is required when scope is section',
        );
      }
      filter.section = sectionParam;
    }

    this.assertFilterInCatalog(catalog, {
      grade: filter.grade,
      scope,
      section: filter.section,
    });

    return filter;
  }

  private resolveLeaderboardFilter(
    viewer: User,
    catalog: PublishedAudienceCatalog,
    query: StudentAudienceQueryDto,
  ): {
    grade: string;
    scope: 'class' | 'section';
    section?: string;
    headline: string;
    description: string;
  } | null {
    this.assertClientEnrollmentMatchesViewer(viewer, query);

    const viewerGrade = viewer.grade?.trim() || null;
    const viewerSection = viewer.section?.trim() || null;

    const grade = viewerGrade;
    if (!grade) {
      return null;
    }

    let scope: 'class' | 'section' =
      query.scope ?? (viewerSection ? 'section' : 'class');
    let section: string | undefined;

    if (scope === 'section') {
      section = viewerSection || undefined;
      if (!section) {
        scope = 'class';
      }
    }

    if (scope === 'section' && !section) {
      throw new BadRequestException('Section is required for section rankings');
    }

    const headline =
      scope === 'section' && section
        ? `${this.formatSectionHeadline(grade, section)} toppers`
        : `${grade} toppers`;

    const description =
      scope === 'section' && section
        ? `Students in ${this.formatSectionHeadline(grade, section)}, ranked by XP from quizzes published for this group.`
        : `Students in ${grade}, ranked by XP from quizzes published for this grade.`;

    return { grade, scope, section, headline, description };
  }

  private assertFilterInCatalog(
    catalog: PublishedAudienceCatalog,
    filter: {
      grade: string;
      scope: 'class' | 'section';
      section?: string;
    },
  ): void {
    if (!isGradeInPublishedCatalog(catalog, filter.grade)) {
      throw new ForbiddenException(
        'No published quizzes target this grade. Choose a grade from the list.',
      );
    }
    if (filter.scope === 'section' && filter.section) {
      if (!isSectionInPublishedCatalog(catalog, filter.grade, filter.section)) {
        throw new ForbiddenException(
          'No published quizzes target this section. Choose a published class group.',
        );
      }
    }
  }

  private requireSchoolId(tenant: TenantContext): string {
    if (!tenant.schoolId) {
      throw new BadRequestException('Student must belong to a school tenant');
    }
    return tenant.schoolId;
  }
}
