import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Question } from './question.entity';
import { Quiz } from './quiz.entity';
import { School } from './school.entity';
import { User } from './user.entity';

@Entity({ name: 'student_responses' })
@Unique('student_responses_one_per_question', ['studentId', 'questionId'])
@Index('idx_student_responses_school_id', ['schoolId'])
@Index('idx_student_responses_school_student', ['schoolId', 'studentId'])
@Index('idx_student_responses_school_quiz', ['schoolId', 'quizId'])
@Index('idx_student_responses_school_student_quiz', ['schoolId', 'studentId', 'quizId'])
export class StudentResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ name: 'quiz_id', type: 'uuid' })
  quizId: string;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId: string;

  @Column({ name: 'selected_option_index', type: 'smallint', nullable: true })
  selectedOptionIndex: number | null;

  @Column({ name: 'is_correct', type: 'boolean' })
  isCorrect: boolean;

  @Column({ name: 'points_earned', type: 'int', default: 0 })
  pointsEarned: number;

  @Column({ name: 'time_spent_seconds', type: 'int', nullable: true })
  timeSpentSeconds: number | null;

  @Column({ name: 'answered_at', type: 'timestamptz', default: () => 'NOW()' })
  answeredAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => School, (school) => school.studentResponses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => User, (user) => user.studentResponses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @ManyToOne(() => Quiz, (quiz) => quiz.studentResponses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'quiz_id' })
  quiz: Quiz;

  @ManyToOne(() => Question, (question) => question.studentResponses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
