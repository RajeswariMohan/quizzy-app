import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { UserSession } from '@database/entities/user-session.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { TenantContextService } from '../auth/services/tenant-context.service';
import { EngagementQueryDto } from './dto/engagement-query.dto';

const TRACKED_ROLES: UserRole[] = [
  UserRole.STUDENT,
  UserRole.PARENT,
  UserRole.TEACHER,
  UserRole.SCHOOL_ADMIN,
];

@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionsRepository: Repository<UserSession>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async getOverview(tenant: TenantContext, query: EngagementQueryDto) {
    const schoolIds = this.resolveSchoolIds(tenant);
    const days = query.days ?? 30;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const qb = this.sessionsRepository
      .createQueryBuilder('s')
      .innerJoin(User, 'u', 'u.id = s.user_id')
      .select('u.role', 'role')
      .addSelect('COUNT(DISTINCT s.user_id)', 'activeUsers')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .addSelect('COALESCE(SUM(s.active_seconds), 0)', 'totalActiveSeconds')
      .addSelect('COALESCE(AVG(s.active_seconds), 0)', 'avgSessionSeconds')
      .where('s.started_at >= :since', { since })
      .andWhere('u.role IN (:...roles)', { roles: TRACKED_ROLES });

    if (schoolIds !== null) {
      if (schoolIds.length === 0) {
        return { days, since: since.toISOString(), byRole: [], users: [] };
      }
      qb.andWhere('s.school_id IN (:...schoolIds)', { schoolIds });
    }

    if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role });
    }

    const byRole = await qb.groupBy('u.role').orderBy('u.role', 'ASC').getRawMany<{
      role: UserRole;
      activeUsers: string;
      sessionCount: string;
      totalActiveSeconds: string;
      avgSessionSeconds: string;
    }>();

    const users = await this.loadUserEngagementRows(schoolIds, since, query);

    const dailyTrend = await this.loadDailyTrend(schoolIds, since, query.role);

    return {
      days,
      since: since.toISOString(),
      byRole: byRole.map((row) => ({
        role: row.role,
        activeUsers: Number(row.activeUsers),
        sessionCount: Number(row.sessionCount),
        totalActiveSeconds: Number(row.totalActiveSeconds),
        avgSessionSeconds: Math.round(Number(row.avgSessionSeconds)),
      })),
      dailyTrend,
      users,
    };
  }

  async getMySessionStats(tenant: TenantContext) {
    const row = await this.sessionsRepository
      .createQueryBuilder('s')
      .select('COALESCE(SUM(s.active_seconds), 0)', 'totalActiveSeconds')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .addSelect('MAX(s.started_at)', 'lastLoginAt')
      .where('s.user_id = :userId', { userId: tenant.userId })
      .getRawOne<{
        totalActiveSeconds: string;
        sessionCount: string;
        lastLoginAt: Date | null;
      }>();

    const open = await this.sessionsRepository.findOne({
      where: { userId: tenant.userId, endedAt: IsNull() },
      order: { startedAt: 'DESC' },
    });

    return {
      totalActiveSeconds: Number(row?.totalActiveSeconds ?? 0),
      sessionCount: Number(row?.sessionCount ?? 0),
      lastLoginAt: row?.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : null,
      currentSessionStartedAt: open?.startedAt?.toISOString() ?? null,
      currentSessionActiveSeconds: open?.activeSeconds ?? 0,
    };
  }

  private async loadUserEngagementRows(
    schoolIds: string[] | null,
    since: Date,
    query: EngagementQueryDto,
  ) {
    const qb = this.usersRepository
      .createQueryBuilder('u')
      .leftJoin(
        UserSession,
        's',
        's.user_id = u.id AND s.started_at >= :since',
        { since },
      )
      .select('u.id', 'userId')
      .addSelect('u.email', 'email')
      .addSelect('u.role', 'role')
      .addSelect('u.display_name', 'displayName')
      .addSelect('u.first_name', 'firstName')
      .addSelect('u.last_name', 'lastName')
      .addSelect('u.grade', 'grade')
      .addSelect('u.section', 'section')
      .addSelect('COALESCE(SUM(s.active_seconds), 0)', 'totalActiveSeconds')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .addSelect('MAX(s.started_at)', 'lastLoginAt')
      .where('u.is_active = true')
      .andWhere('u.role IN (:...roles)', { roles: TRACKED_ROLES });

    if (schoolIds !== null) {
      if (schoolIds.length === 0) return [];
      qb.andWhere('u.school_id IN (:...schoolIds)', { schoolIds });
    }

    if (query.role) {
      qb.andWhere('u.role = :role', { role: query.role });
    }

    if (query.search?.trim()) {
      const term = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(u.email) LIKE :term OR LOWER(u.first_name) LIKE :term OR LOWER(u.last_name) LIKE :term OR LOWER(COALESCE(u.display_name, '')) LIKE :term)`,
        { term },
      );
    }

    const rows = await qb
      .groupBy('u.id')
      .addGroupBy('u.email')
      .addGroupBy('u.role')
      .addGroupBy('u.display_name')
      .addGroupBy('u.first_name')
      .addGroupBy('u.last_name')
      .addGroupBy('u.grade')
      .addGroupBy('u.section')
      .orderBy('COALESCE(SUM(s.active_seconds), 0)', 'DESC')
      .limit(100)
      .getRawMany<{
        userId: string;
        email: string;
        role: UserRole;
        displayName: string | null;
        firstName: string;
        lastName: string;
        grade: string | null;
        section: string | null;
        totalActiveSeconds: string;
        sessionCount: string;
        lastLoginAt: Date | null;
      }>();

    return rows
      .map((row) => ({
        userId: row.userId,
        email: row.email,
        role: row.role,
        displayName:
          row.displayName ?? `${row.firstName} ${row.lastName}`.trim(),
        grade: row.grade,
        section: row.section,
        totalActiveSeconds: Number(row.totalActiveSeconds),
        sessionCount: Number(row.sessionCount),
        lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : null,
      }))
      .filter((row) => row.sessionCount > 0);
  }

  private async loadDailyTrend(
    schoolIds: string[] | null,
    since: Date,
    role?: UserRole,
  ) {
    const qb = this.sessionsRepository
      .createQueryBuilder('s')
      .innerJoin(User, 'u', 'u.id = s.user_id')
      .select("TO_CHAR(s.started_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(s.active_seconds), 0)', 'activeSeconds')
      .addSelect('COUNT(DISTINCT s.user_id)', 'activeUsers')
      .where('s.started_at >= :since', { since })
      .andWhere('u.role IN (:...roles)', { roles: TRACKED_ROLES });

    if (schoolIds !== null && schoolIds.length > 0) {
      qb.andWhere('s.school_id IN (:...schoolIds)', { schoolIds });
    } else if (schoolIds !== null && schoolIds.length === 0) {
      return [];
    }

    if (role) {
      qb.andWhere('u.role = :role', { role });
    }

    const rows = await qb
      .groupBy("TO_CHAR(s.started_at, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(s.started_at, 'YYYY-MM-DD')", 'ASC')
      .getRawMany<{ date: string; activeSeconds: string; activeUsers: string }>();

    return rows.map((row) => ({
      date: row.date,
      activeSeconds: Number(row.activeSeconds),
      activeUsers: Number(row.activeUsers),
    }));
  }

  private resolveSchoolIds(tenant: TenantContext): string[] | null {
    if (tenant.isSuperAdmin) {
      const ids = this.tenantContextService.resolveSchoolIdsForQuery(tenant);
      return ids.length > 0 ? ids : null;
    }
    const schoolId = this.tenantContextService.resolveSchoolIdForQuery(tenant);
    if (!schoolId) {
      throw new ForbiddenException('School context required');
    }
    return [schoolId];
  }
}
