import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { School } from './school.entity';
import { User } from './user.entity';

@Entity({ name: 'parent_student_links' })
@Index('idx_parent_student_links_parent', ['schoolId', 'parentUserId'])
@Index('idx_parent_student_links_student', ['schoolId', 'studentUserId'])
export class ParentStudentLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'school_id', type: 'uuid' })
  schoolId: string;

  @Column({ name: 'parent_user_id', type: 'uuid' })
  parentUserId: string;

  @Column({ name: 'student_user_id', type: 'uuid' })
  studentUserId: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => School, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'school_id' })
  school: School;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_user_id' })
  parent: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_user_id' })
  student: User;
}
