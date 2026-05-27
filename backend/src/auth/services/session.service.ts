import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { UserSession } from '@database/entities/user-session.entity';
import { User } from '@database/entities/user.entity';

/** Gaps longer than this between heartbeats are not counted as active time. */
const MAX_IDLE_GAP_SECONDS = 5 * 60;

/** Minimum interval between DB writes for session touches. */
const TOUCH_THROTTLE_MS = 60_000;

export interface StartSessionMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  private readonly lastTouchAt = new Map<string, number>();
  private sessionsTableAvailable = true;

  constructor(
    @InjectRepository(UserSession)
    private readonly sessionsRepository: Repository<UserSession>,
  ) {}

  async startSession(user: User, meta: StartSessionMeta = {}): Promise<string | null> {
    if (!this.sessionsTableAvailable) {
      return null;
    }

    try {
      const now = new Date();
      const row = this.sessionsRepository.create({
        userId: user.id,
        schoolId: user.schoolId,
        role: user.role,
        ipAddress: meta.ipAddress ?? null,
        userAgent: meta.userAgent ?? null,
        startedAt: now,
        lastSeenAt: now,
        endedAt: null,
        activeSeconds: 0,
      });
      const saved = await this.sessionsRepository.save(row);
      this.lastTouchAt.set(saved.id, now.getTime());
      return saved.id;
    } catch (error) {
      if (this.isMissingSessionsTable(error)) {
        this.sessionsTableAvailable = false;
        this.logger.warn(
          'user_sessions table missing — run database/migrations/007_user_sessions.sql. Login works without session tracking.',
        );
        return null;
      }
      throw error;
    }
  }

  async assertSessionActive(sessionId: string): Promise<void> {
    if (!this.sessionsTableAvailable) {
      return;
    }

    try {
      const session = await this.sessionsRepository.findOne({
        where: { id: sessionId, endedAt: IsNull() },
      });
      if (!session) {
        throw new UnauthorizedException('Session has ended. Please sign in again.');
      }
    } catch (error) {
      if (this.isMissingSessionsTable(error)) {
        this.sessionsTableAvailable = false;
        return;
      }
      throw error;
    }
  }

  async touchSession(sessionId: string): Promise<void> {
    if (!this.sessionsTableAvailable) {
      return;
    }

    try {
      const nowMs = Date.now();
      const last = this.lastTouchAt.get(sessionId) ?? 0;
      if (nowMs - last < TOUCH_THROTTLE_MS) {
        return;
      }

      const session = await this.sessionsRepository.findOne({
        where: { id: sessionId, endedAt: IsNull() },
      });
      if (!session) {
        return;
      }

      const now = new Date();
      const deltaSeconds = Math.min(
        Math.floor((now.getTime() - session.lastSeenAt.getTime()) / 1000),
        MAX_IDLE_GAP_SECONDS,
      );
      session.activeSeconds += Math.max(0, deltaSeconds);
      session.lastSeenAt = now;
      await this.sessionsRepository.save(session);
      this.lastTouchAt.set(sessionId, nowMs);
    } catch (error) {
      if (this.isMissingSessionsTable(error)) {
        this.sessionsTableAvailable = false;
        return;
      }
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<void> {
    if (!this.sessionsTableAvailable) {
      return;
    }

    try {
      const session = await this.sessionsRepository.findOne({
        where: { id: sessionId, endedAt: IsNull() },
      });
      if (!session) {
        return;
      }

      const now = new Date();
      const deltaSeconds = Math.min(
        Math.floor((now.getTime() - session.lastSeenAt.getTime()) / 1000),
        MAX_IDLE_GAP_SECONDS,
      );
      session.activeSeconds += Math.max(0, deltaSeconds);
      session.lastSeenAt = now;
      session.endedAt = now;
      await this.sessionsRepository.save(session);
      this.lastTouchAt.delete(sessionId);
    } catch (error) {
      if (this.isMissingSessionsTable(error)) {
        this.sessionsTableAvailable = false;
        return;
      }
      throw error;
    }
  }

  async endOpenSessionsForUser(userId: string): Promise<void> {
    if (!this.sessionsTableAvailable) {
      return;
    }
    const open = await this.sessionsRepository.find({
      where: { userId, endedAt: IsNull() },
    });
    await Promise.all(open.map((s) => this.endSession(s.id)));
  }

  private isMissingSessionsTable(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }
    const driver = error.driverError as { code?: string } | undefined;
    return driver?.code === '42P01';
  }
}
