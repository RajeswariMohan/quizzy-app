import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFeedback } from '@database/entities/user-feedback.entity';
import { FeedbackCategory } from '@database/enums/feedback-category.enum';
import { FeedbackStatus } from '@database/enums/feedback-status.enum';
import { UserRole } from '@database/enums/user-role.enum';
import { TenantContext } from '../auth/interfaces/tenant-context.interface';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { ListFeedbackQueryDto } from './dto/list-feedback-query.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';

const SUBMITTER_ROLES: UserRole[] = [
  UserRole.STUDENT,
  UserRole.PARENT,
  UserRole.SCHOOL_ADMIN,
];

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(UserFeedback)
    private readonly feedbackRepository: Repository<UserFeedback>,
  ) {}

  async create(tenant: TenantContext, dto: CreateFeedbackDto) {
    if (!SUBMITTER_ROLES.includes(tenant.role)) {
      throw new ForbiddenException('Your role cannot submit feedback through this portal');
    }

    const row = this.feedbackRepository.create({
      schoolId: tenant.schoolId,
      userId: tenant.userId,
      role: tenant.role,
      category: dto.category ?? FeedbackCategory.GENERAL,
      rating: dto.rating ?? null,
      message: dto.message.trim(),
      status: FeedbackStatus.OPEN,
      adminNotes: null,
    });

    const saved = await this.feedbackRepository.save(row);
    return this.toItem(saved);
  }

  async listMine(tenant: TenantContext) {
    if (!SUBMITTER_ROLES.includes(tenant.role)) {
      throw new ForbiddenException('Your role cannot view feedback here');
    }

    const rows = await this.feedbackRepository.find({
      where: { userId: tenant.userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return { items: rows.map((row) => this.toItem(row)) };
  }

  async listForAdmin(query: ListFeedbackQueryDto) {
    const qb = this.feedbackRepository
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.user', 'user')
      .leftJoinAndSelect('f.school', 'school')
      .orderBy('f.created_at', 'DESC');

    if (query.status) {
      qb.andWhere('f.status = :status', { status: query.status });
    }
    if (query.role) {
      qb.andWhere('f.role = :role', { role: query.role });
    }
    if (query.schoolId) {
      qb.andWhere('f.school_id = :schoolId', { schoolId: query.schoolId });
    }

    const rows = await qb.getMany();
    const openCount = rows.filter((r) => r.status === FeedbackStatus.OPEN).length;

    return {
      openCount,
      total: rows.length,
      items: rows.map((row) => this.toAdminItem(row)),
    };
  }

  async updateForAdmin(feedbackId: string, dto: UpdateFeedbackDto) {
    const row = await this.feedbackRepository.findOne({
      where: { id: feedbackId },
      relations: ['user', 'school'],
    });
    if (!row) {
      throw new NotFoundException('Feedback not found');
    }

    if (dto.status !== undefined) {
      row.status = dto.status;
    }
    if (dto.adminNotes !== undefined) {
      row.adminNotes = dto.adminNotes.trim() || null;
    }

    const saved = await this.feedbackRepository.save(row);
    return this.toAdminItem(saved);
  }

  private toItem(row: UserFeedback) {
    return {
      id: row.id,
      category: row.category,
      rating: row.rating,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toAdminItem(row: UserFeedback) {
    const user = row.user;
    const school = row.school;
    return {
      id: row.id,
      schoolId: row.schoolId,
      schoolName: school?.name ?? null,
      userId: row.userId,
      userEmail: user?.email ?? null,
      userDisplayName:
        user?.displayName ??
        (user ? `${user.firstName} ${user.lastName}`.trim() : null),
      role: row.role,
      category: row.category,
      rating: row.rating,
      message: row.message,
      status: row.status,
      adminNotes: row.adminNotes,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
