import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AiGenerationStatus } from '../enums/ai-generation-status.enum';
import { Question } from './question.entity';
import { Quiz } from './quiz.entity';
import { School } from './school.entity';
import { User } from './user.entity';

export interface AiGenerationMetrics {
  llmLatencyMs?: number;
  parseDurationMs?: number;
  validationErrors?: number;
  questionsPersisted?: number;
  mockModelVersion?: string;
}

@Entity({ name: 'ai_generation_tasks' })
@Index('idx_ai_generation_tasks_school_id', ['schoolId'])
@Index('idx_ai_generation_tasks_school_quiz', ['schoolId', 'quizId'])
@Index('idx_ai_generation_tasks_school_status', ['schoolId', 'status'])
export class AiGenerationTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @Column({ name: 'requested_by_user_id', type: 'uuid' })
  requestedByUserId: string;

  @Column({
    type: 'enum',
    enum: AiGenerationStatus,
    enumName: 'ai_generation_status',
    default: AiGenerationStatus.PENDING,
  })
  status: AiGenerationStatus;

  @Column({ type: 'text' })
  prompt: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  board: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  topic: string | null;

  @Column({ name: 'source_text', type: 'text', nullable: true })
  sourceText: string | null;

  @Column({ name: 'requested_count', type: 'int' })
  requestedCount: number;

  @Column({ name: 'completed_count', type: 'int', default: 0 })
  completedCount: number;

  @Column({ name: 'failed_count', type: 'int', default: 0 })
  failedCount: number;

  @Column({ name: 'ai_model_used', type: 'varchar', length: 100, nullable: true })
  aiModelUsed: string | null;

  @Column({ name: 'bull_job_id', type: 'varchar', length: 100, nullable: true })
  bullJobId: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string | null;

  @Column({ type: 'jsonb', default: {} })
  metrics: AiGenerationMetrics;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => Quiz, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'requested_by_user_id' })
  requestedBy: User;

  @OneToMany(() => Question, (question) => question.aiGenerationTask)
  questions: Question[];
}
