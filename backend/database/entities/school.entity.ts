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
