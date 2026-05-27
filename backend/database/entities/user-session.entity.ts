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
import { UserRole } from '../enums/user-role.enum';
import { School } from './school.entity';
import { User } from './user.entity';

@Entity({ name: 'user_sessions' })
@Index('idx_user_sessions_user_id', ['userId'])
@Index('idx_user_sessions_school_id', ['schoolId'])
export class UserSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role: UserRole;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ name: 'started_at', type: 'timestamptz' })
  startedAt: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt: Date | null;

  @Column({ name: 'active_seconds', type: 'int', default: 0 })
  activeSeconds: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  @ManyToOne(() => School, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school?: School | null;
}
