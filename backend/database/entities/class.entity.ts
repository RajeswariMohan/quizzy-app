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
import { Quiz } from './quiz.entity';
import { School } from './school.entity';
import { User } from './user.entity';

@Entity({ name: 'classes' })
@Index('idx_classes_school_id', ['schoolId'])
@Index('idx_classes_school_grade', ['schoolId', 'grade'])
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 20 })
  grade: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  section: string | null;

  @Column({ name: 'academic_year', type: 'varchar', length: 9 })
  academicYear: string;

  @Column({ name: 'homeroom_teacher_id', type: 'uuid', nullable: true })
  homeroomTeacherId: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToOne(() => School, (school) => school.classes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => User, (user) => user.homeroomClasses, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'homeroom_teacher_id' })
  homeroomTeacher: User | null;

  @OneToMany(() => Quiz, (quiz) => quiz.class)
  quizzes: Quiz[];
}
