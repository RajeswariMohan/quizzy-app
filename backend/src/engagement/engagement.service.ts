import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
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
    const visibleRoles = this.resolveVisibleRoles(tenant);
    const { since, until, days, dateFrom, dateTo } = this.resolveEngagementWindow(query);
    const requestedRole =
      query.role && visibleRoles.includes(query.role) ? query.role : undefined;
    const teacherSessionTableOnly = tenant.role === UserRole.TEACHER;

    const qb = this.sessionsRepository
      .createQueryBuilder('s')
      .innerJoin(User, 'u', 'u.id = s.user_id')
      .select('u.role', 'role')
      .addSelect('COUNT(DISTINCT s.user_id)', 'activeUsers')
      .addSelect('COUNT(s.id)', 'sessionCount')
      .addSelect('COALESCE(SUM(s.active_seconds), 0)', 'totalActiveSeconds')
      .addSelect('COALESCE(AVG(s.active_seconds), 0)', 'avgSessionSeconds')
      .where('s.started_at >= :since', { since })
      .andWhere('s.started_at <= :until', { until })
      .andWhere('u.role IN (:...roles)', { roles: visibleRoles });

    if (schoolIds !== null) {
      if (schoolIds.length === 0) {
        return {
          days,
          dateFrom,
          dateTo,
          since: since.toISOString(),
          until: until.toISOString(),
          byRole: [],
          dailyTrend: [],
          users: [],
        };
      }
      qb.andWhere('s.school_id IN (:...schoolIds)', { schoolIds });
    }

    if (requestedRole) {
      qb.andWhere('u.role = :role', { role: requestedRole });
    }

    if (teacherSessionTableOnly) {
      qb.andWhere(
        '(u.role <> :teacherRole OR u.id = :teacherUserId)',
        {
          teacherRole: UserRole.TEACHER,
          teacherUserId: tenant.userId,
        },
      );
    }

    const byRole = await qb.groupBy('u.role').orderBy('u.role', 'ASC').getRawMany<{
      role: UserRole;
      activeUsers: string;
      sessionCount: string;
      totalActiveSeconds: string;
      avgSessionSeconds: string;
    }>();

    const users = await this.loadUserEngagementRows(
      tenant,
      schoolIds,
      since,
      until,
      requestedRole,
      visibleRoles,
      query.search,
      teacherSessionTableOnly,
    );

    const dailyTrend = await this.loadDailyTrend(
      tenant,
      schoolIds,
      since,
      until,
      requestedRole,
      visibleRoles,
    );

    return {
      days,
      dateFrom,
      dateTo,
      since: since.toISOString(),
      until: until.toISOString(),
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

  private resolveEngagementWindow(query: EngagementQueryDto): {
    since: Date;
    until: Date;
    days: number;
    dateFrom: string;
    dateTo: string;
  } {
    const until = query.dateTo?.trim()
      ? new Date(`${query.dateTo.trim()}T23:59:59.999`)
      : new Date();

    let since: Date;
    if (query.dateFrom?.trim()) {
      since = new Date(`${query.dateFrom.trim()}T00:00:00.000`);
    } else {
      const days = query.days ?? 30;
      since = new Date(until);
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);
    }

    if (since.getTime() > until.getTime()) {
      throw new BadRequestException('dateFrom must be on or before dateTo');
    }

    const spanMs = until.getTime() - since.getTime();
    const maxSpanMs = 90 * 24 * 60 * 60 * 1000;
    if (spanMs > maxSpanMs) {
      throw new BadRequestException('Date range cannot exceed 90 days');
    }

    const days = Math.max(
      1,
      Math.ceil(spanMs / (24 * 60 * 60 * 1000)),
    );

    const toIso = (d: Date) => d.toISOString().slice(0, 10);

    return {
      since,
      until,
      days,
      dateFrom: query.dateFrom?.trim() || toIso(since),
      dateTo: query.dateTo?.trim() || toIso(until),
    };
  }

  private async loadUserEngagementRows(
    tenant: TenantContext,
    schoolIds: string[] | null,
    since: Date,
    until: Date,
    requestedRole: UserRole | undefined,
    visibleRoles: UserRole[],
    search: string | undefined,
    teacherSessionTableOnly: boolean,
  ) {
    const qb = this.usersRepository
      .createQueryBuilder('u')
      .leftJoin(
        UserSession,
        's',
        's.user_id = u.id AND s.started_at >= :since AND s.started_at <= :until',
        { since, until },
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
      .andWhere('u.role IN (:...roles)', { roles: visibleRoles });

    if (schoolIds !== null) {
      if (schoolIds.length === 0) return [];
      qb.andWhere('u.school_id IN (:...schoolIds)', { schoolIds });
    }

    if (requestedRole) {
      qb.andWhere('u.role = :role', { role: requestedRole });
    }

    if (teacherSessionTableOnly) {
      qb.andWhere('u.id = :teacherUserId', { teacherUserId: tenant.userId });
    }

    if (search?.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
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
    tenant: TenantContext,
    schoolIds: string[] | null,
    since: Date,
    until: Date,
    requestedRole: UserRole | undefined,
    visibleRoles: UserRole[],
  ) {
    const qb = this.sessionsRepository
      .createQueryBuilder('s')
      .innerJoin(User, 'u', 'u.id = s.user_id')
      .select("TO_CHAR(s.started_at, 'YYYY-MM-DD')", 'date')
      .addSelect('COALESCE(SUM(s.active_seconds), 0)', 'activeSeconds')
      .addSelect('COUNT(DISTINCT s.user_id)', 'activeUsers')
      .where('s.started_at >= :since', { since })
      .andWhere('s.started_at <= :until', { until })
      .andWhere('u.role IN (:...roles)', { roles: visibleRoles });

    if (schoolIds !== null && schoolIds.length > 0) {
      qb.andWhere('s.school_id IN (:...schoolIds)', { schoolIds });
    } else if (schoolIds !== null && schoolIds.length === 0) {
      return [];
    }

    if (requestedRole) {
      qb.andWhere('u.role = :role', { role: requestedRole });
    }

    if (tenant.role === UserRole.TEACHER) {
      qb.andWhere(
        '(u.role <> :teacherRole OR u.id = :teacherUserId)',
        {
          teacherRole: UserRole.TEACHER,
          teacherUserId: tenant.userId,
        },
      );
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

  private resolveVisibleRoles(tenant: TenantContext): UserRole[] {
    if (tenant.role === UserRole.TEACHER) {
      return [UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER];
    }
    return TRACKED_ROLES;
  }
}
