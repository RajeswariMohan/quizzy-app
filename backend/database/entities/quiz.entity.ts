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
import { QuizStatus } from '../enums/quiz-status.enum';
import { Class } from './class.entity';
import { Question } from './question.entity';
import { School } from './school.entity';
import { StudentResponse } from './student-response.entity';
import { User } from './user.entity';

@Entity({ name: 'quizzes' })
@Index('idx_quizzes_school_id', ['schoolId'])
@Index('idx_quizzes_school_class', ['schoolId', 'classId'])
@Index('idx_quizzes_school_status', ['schoolId', 'status'])
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'class_id', type: 'uuid' })
  classId: string;

  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: QuizStatus, enumName: 'quiz_status', default: QuizStatus.DRAFT })
  status: QuizStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  topic: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  board: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string | null;

  @Column({ name: 'time_limit_minutes', type: 'int', nullable: true })
  timeLimitMinutes: number | null;

  @Column({ name: 'total_xp_reward', type: 'int', default: 0 })
  totalXpReward: number;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
  startsAt: Date | null;

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => School, (school) => school.quizzes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => Class, (classEntity) => classEntity.quizzes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @ManyToOne(() => User, (user) => user.createdQuizzes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @OneToMany(() => Question, (question) => question.quiz)
  questions: Question[];

  @OneToMany(() => StudentResponse, (response) => response.quiz)
  studentResponses: StudentResponse[];
}
