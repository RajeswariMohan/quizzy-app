import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FeedbackCategory } from '../enums/feedback-category.enum';
import { FeedbackStatus } from '../enums/feedback-status.enum';
import { UserRole } from '../enums/user-role.enum';
import { School } from './school.entity';
import { User } from './user.entity';

@Entity({ name: 'user_feedback' })
@Index('idx_user_feedback_status', ['status', 'createdAt'])
@Index('idx_user_feedback_school_id', ['schoolId'])
export class UserFeedback {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: FeedbackCategory,
    enumName: 'feedback_category',
    default: FeedbackCategory.GENERAL,
  })
  category: FeedbackCategory;

  @Column({ type: 'smallint', nullable: true })
  rating: number | null;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: FeedbackStatus,
    enumName: 'feedback_status',
    default: FeedbackStatus.OPEN,
  })
  status: FeedbackStatus;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => School, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school?: School | null;
}
