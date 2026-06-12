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
import { UserRole } from '../enums/user-role.enum';
import { Class } from './class.entity';
import { Question } from './question.entity';
import { Quiz } from './quiz.entity';
import { School } from './school.entity';
import { StudentResponse } from './student-response.entity';

@Entity({ name: 'users' })
@Index('idx_users_school_id', ['schoolId'])
@Index('idx_users_school_role', ['schoolId', 'role'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id', type: 'uuid', nullable: true })
  schoolId: string | null;

  @Column({ type: 'varchar', length: 320 })
  email: string;

  /** School-scoped login id for students (unique per school). */
  @Column({ type: 'varchar', length: 32, nullable: true })
  username: string | null;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role' })
  role: UserRole;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ name: 'display_name', type: 'varchar', length: 200, nullable: true })
  displayName: string | null;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  /** Grade/standard for students (matches school grade_options). */
  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string | null;

  /** Class section for students (matches school section_options). */
  @Column({ type: 'varchar', length: 20, nullable: true })
  section: string | null;

  /** Parent contact email supplied at student self-service signup. */
  @Column({ name: 'parent_email', type: 'varchar', length: 320, nullable: true })
  parentEmail: string | null;

  /** Free-text school name/address when student selects "Other" at signup. */
  @Column({ name: 'signup_school_note', type: 'text', nullable: true })
  signupSchoolNote: string | null;

  @Column({ name: 'xp_points', type: 'int', default: 0 })
  xpPoints: number;

  @Column({ name: 'current_streak', type: 'int', default: 0 })
  currentStreak: number;

  @Column({ name: 'last_activity_date', type: 'date', nullable: true })
  lastActivityDate: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
  emailVerifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => School, (school) => school.users, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'school_id' })
  school: School | null;

  @OneToMany(() => Class, (classEntity) => classEntity.homeroomTeacher)
  homeroomClasses: Class[];

  @OneToMany(() => Quiz, (quiz) => quiz.createdBy)
  createdQuizzes: Quiz[];

  @OneToMany(() => Question, (question) => question.generatedBy)
  generatedQuestions: Question[];

  @OneToMany(() => StudentResponse, (response) => response.student)
  studentResponses: StudentResponse[];
}
