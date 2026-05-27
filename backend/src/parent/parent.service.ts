import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '@database/entities/quiz.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { ParentStudentLinkService } from './parent-student-link.service';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(StudentResponse)
    private readonly responseRepository: Repository<StudentResponse>,
    private readonly tenantContextService: TenantContextService,
    private readonly parentStudentLinkService: ParentStudentLinkService,
  ) {}

  async listLinkedChildren(tenant: TenantContext) {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const students = await this.parentStudentLinkService.listLinkedStudents(
      tenant.userId,
      schoolId,
    );

    return students.map((student) => ({
      userId: student.id,
      email: student.email,
      displayName:
        student.displayName ?? `${student.firstName} ${student.lastName}`.trim(),
      xpPoints: student.xpPoints,
      currentStreak: student.currentStreak,
    }));
  }

  async linkStudent(tenant: TenantContext, studentEmail: string) {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const student = await this.parentStudentLinkService.linkByStudentEmail(
      tenant.userId,
      schoolId,
      studentEmail,
    );

    return {
      userId: student.id,
      email: student.email,
      displayName:
        student.displayName ?? `${student.firstName} ${student.lastName}`.trim(),
    };
  }

  async getChildSummary(tenant: TenantContext, studentUserId?: string) {
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    const child = await this.parentStudentLinkService.resolveLinkedStudent(
      tenant.userId,
      schoolId,
      studentUserId,
    );

    return this.buildChildSummary(child, schoolId);
  }

  private async buildChildSummary(child: User, schoolId: string) {
    const displayName =
      child.displayName ?? `${child.firstName} ${child.lastName}`.trim();

    const stats = await this.responseRepository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'totalAnswers')
      .addSelect('COUNT(DISTINCT r.quiz_id)', 'quizzesTaken')
      .addSelect(
        'ROUND(100.0 * SUM(CASE WHEN r.is_correct THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0), 0)',
        'accuracy',
      )
      .where('r.student_id = :studentId', { studentId: child.id })
      .andWhere('r.school_id = :schoolId', { schoolId })
      .getRawOne<{
        totalAnswers: string;
        quizzesTaken: string;
        accuracy: string | null;
      }>();

    const recent = await this.responseRepository
      .createQueryBuilder('r')
      .innerJoin(Quiz, 'q', 'q.id = r.quiz_id')
      .select('q.title', 'title')
      .addSelect('r.is_correct', 'isCorrect')
      .addSelect('r.points_earned', 'points')
      .addSelect('r.answered_at', 'answeredAt')
      .where('r.student_id = :studentId', { studentId: child.id })
      .orderBy('r.answered_at', 'DESC')
      .limit(10)
      .getRawMany<{
        title: string;
        isCorrect: boolean;
        points: string;
        answeredAt: Date;
      }>();

    return {
      child: {
        userId: child.id,
        displayName,
        xpPoints: child.xpPoints,
        currentStreak: child.currentStreak,
      },
      stats: {
        quizzesTaken: Number(stats?.quizzesTaken ?? 0),
        accuracy: Number(stats?.accuracy ?? 0),
        totalAnswers: Number(stats?.totalAnswers ?? 0),
      },
      recentActivity: recent.map((row, index) => ({
        id: String(index),
        title: row.isCorrect
          ? `${displayName} scored +${row.points} XP`
          : `${displayName} attempted "${row.title}"`,
        description: row.isCorrect ? 'Correct answer' : 'Review recommended',
        timestamp: new Date(row.answeredAt).toLocaleString(),
        type: row.isCorrect ? 'score' : 'quiz',
      })),
    };
  }
}
