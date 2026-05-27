import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentStudentLink } from '@database/entities/parent-student-link.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';

@Injectable()
export class ParentStudentLinkService {
  constructor(
    @InjectRepository(ParentStudentLink)
    private readonly linksRepository: Repository<ParentStudentLink>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async listLinkedStudents(parentUserId: string, schoolId: string): Promise<User[]> {
    const links = await this.linksRepository.find({
      where: { parentUserId, schoolId, isActive: true },
      relations: ['student'],
      order: { createdAt: 'ASC' },
    });

    return links
      .map((link) => link.student)
      .filter((student): student is User => Boolean(student?.isActive));
  }

  async linkByStudentEmail(
    parentUserId: string,
    schoolId: string,
    studentEmail: string,
  ): Promise<User> {
    const email = studentEmail.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Student email is required');
    }

    const student = await this.usersRepository.findOne({
      where: { email, schoolId, role: UserRole.STUDENT, isActive: true },
    });

    if (!student) {
      throw new NotFoundException(
        'No active student account found with that email in your school',
      );
    }

    return this.createLink(parentUserId, schoolId, student.id);
  }

  async createLink(
    parentUserId: string,
    schoolId: string,
    studentUserId: string,
  ): Promise<User> {
    if (parentUserId === studentUserId) {
      throw new BadRequestException('A parent cannot be linked to themselves');
    }

    const parent = await this.usersRepository.findOne({
      where: { id: parentUserId, schoolId, role: UserRole.PARENT, isActive: true },
    });
    if (!parent) {
      throw new NotFoundException('Parent account not found');
    }

    const student = await this.usersRepository.findOne({
      where: { id: studentUserId, schoolId, role: UserRole.STUDENT, isActive: true },
    });
    if (!student) {
      throw new NotFoundException('Student account not found in this school');
    }

    const existing = await this.linksRepository.findOne({
      where: { schoolId, parentUserId, studentUserId },
    });

    if (existing?.isActive) {
      throw new ConflictException('This student is already linked to your account');
    }

    if (existing && !existing.isActive) {
      existing.isActive = true;
      await this.linksRepository.save(existing);
      return student;
    }

    const link = this.linksRepository.create({
      schoolId,
      parentUserId,
      studentUserId,
      isActive: true,
    });
    await this.linksRepository.save(link);
    return student;
  }

  async resolveLinkedStudent(
    parentUserId: string,
    schoolId: string,
    studentUserId?: string,
  ): Promise<User> {
    const students = await this.listLinkedStudents(parentUserId, schoolId);

    if (students.length === 0) {
      throw new NotFoundException(
        'No linked students. Link your child using their school email.',
      );
    }

    if (!studentUserId) {
      return students[0];
    }

    const match = students.find((s) => s.id === studentUserId);
    if (!match) {
      throw new NotFoundException('That student is not linked to your account');
    }

    return match;
  }
}
