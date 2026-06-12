import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Class } from './class.entity';
import { Question } from './question.entity';
import { Quiz } from './quiz.entity';
import { StudentResponse } from './student-response.entity';
import { User } from './user.entity';
import { SchoolSubscriptionTier } from '../enums/school-subscription-tier.enum';

@Entity({ name: 'schools' })
export class School {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl: string | null;

  @Column({ name: 'primary_color', type: 'varchar', length: 7, default: '#2563EB' })
  primaryColor: string;

  @Column({ name: 'secondary_color', type: 'varchar', length: 7, default: '#7C3AED' })
  secondaryColor: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  board: string | null;

  @Column({ type: 'varchar', length: 64, default: 'UTC' })
  timezone: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  /** Null means no cap enforced */
  @Column({ name: 'max_students', type: 'int', nullable: true })
  maxStudents: number | null;

  @Column({ name: 'max_teachers', type: 'int', nullable: true })
  maxTeachers: number | null;

  @Column({ name: 'max_parents', type: 'int', nullable: true })
  maxParents: number | null;

  /** Allowed grade/standard labels for student onboarding (school-configurable). */
  @Column({ name: 'grade_options', type: 'jsonb', default: () => "'[]'" })
  gradeOptions: string[];

  /** Allowed section labels e.g. A, B, C, D (school-configurable). */
  @Column({
    name: 'section_options',
    type: 'jsonb',
    default: () => '\'["A","B","C","D"]\'',
  })
  sectionOptions: string[];

  /** Allowed subjects for quizzes and student profiles (school-configurable). */
  @Column({
    name: 'subject_options',
    type: 'jsonb',
    default: () => "'[]'",
  })
  subjectOptions: string[];

  /** Grade → section names, e.g. { "Class 1": ["Tulip", "Lilly"] }. */
  @Column({ name: 'grade_section_map', type: 'jsonb', default: () => "'{}'" })
  gradeSectionMap: Record<string, string[]>;

  @Column({
    name: 'subscription_tier',
    type: 'varchar',
    length: 20,
    default: SchoolSubscriptionTier.STANDARD,
  })
  subscriptionTier: SchoolSubscriptionTier;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.school)
  users: User[];

  @OneToMany(() => Class, (classEntity) => classEntity.school)
  classes: Class[];

  @OneToMany(() => Quiz, (quiz) => quiz.school)
  quizzes: Quiz[];

  @OneToMany(() => Question, (question) => question.school)
  questions: Question[];

  @OneToMany(() => StudentResponse, (response) => response.school)
  studentResponses: StudentResponse[];
}
