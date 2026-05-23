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
import { QuestionSourceType } from '../enums/question-source-type.enum';
import { AiGenerationTask } from './ai-generation-task.entity';
import { Quiz } from './quiz.entity';
import { School } from './school.entity';
import { StudentResponse } from './student-response.entity';
import { User } from './user.entity';

@Entity({ name: 'questions' })
@Index('idx_questions_school_id', ['schoolId'])
@Index('idx_questions_school_quiz', ['schoolId', 'quizId'])
@Index('idx_questions_school_quiz_order', ['schoolId', 'quizId', 'orderIndex'])
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @Column({ name: 'question_text', type: 'text' })
  questionText: string;

  /** Four MCQ option strings: index 0–3 maps to A–D */
  @Column({ type: 'jsonb' })
  options: string[];

  @Column({ name: 'correct_option_index', type: 'smallint' })
  correctOptionIndex: number;

  @Column({ type: 'text', nullable: true })
  explanation: string | null;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  orderIndex: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  difficulty: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subject: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  topic: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  board: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string | null;

  @Column({ type: 'int', default: 10 })
  points: number;

  @Column({
    name: 'source_type',
    type: 'enum',
    enum: QuestionSourceType,
    enumName: 'question_source_type',
    default: QuestionSourceType.MANUAL,
  })
  sourceType: QuestionSourceType;

  @Column({ name: 'ai_model_used', type: 'varchar', length: 100, nullable: true })
  aiModelUsed: string | null;

  @Column({ name: 'generated_by_user_id', type: 'uuid', nullable: true })
  generatedByUserId: string | null;

  @Column({ name: 'ai_prompt_snapshot', type: 'text', nullable: true })
  aiPromptSnapshot: string | null;

  @Column({ name: 'ai_generation_task_id', type: 'uuid', nullable: true })
  aiGenerationTaskId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => School, (school) => school.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => Quiz, (quiz) => quiz.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @ManyToOne(() => User, (user) => user.generatedQuestions, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'generated_by_user_id' })
  generatedBy: User | null;

  @ManyToOne(() => AiGenerationTask, (task) => task.questions, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'ai_generation_task_id' })
  aiGenerationTask: AiGenerationTask | null;

  @OneToMany(() => StudentResponse, (response) => response.question)
  studentResponses: StudentResponse[];
}
