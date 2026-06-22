import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { SchoolLimitsService } from '../../school/school-limits.service';

@Injectable()
export class SignupApprovalService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly schoolLimitsService: SchoolLimitsService,
  ) {}

  async listPendingStudents(schoolId: string) {
    const users = await this.usersRepository.find({
      where: {
        schoolId,
        role: UserRole.STUDENT,
        isActive: false,
      },
      order: { createdAt: 'DESC' },
    });
    return users
      .filter((u) => u.signupPendingAt !== null)
      .map((u) => this.toPendingRow(u));
  }

  async approvePendingUser(
    schoolId: string,
    userId: string,
    approverRole: UserRole.SCHOOL_ADMIN | UserRole.TEACHER,
  ): Promise<{ success: true; userId: string }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId, schoolId },
    });
    if (!user?.signupPendingAt) {
      throw new NotFoundException('Pending signup request not found');
    }
    if (user.isActive) {
      throw new BadRequestException('This account is already active');
    }

    if (approverRole === UserRole.TEACHER && user.role !== UserRole.STUDENT) {
      throw new ForbiddenException('Teachers can only approve student signups');
    }
    if (
      approverRole === UserRole.SCHOOL_ADMIN &&
      user.role !== UserRole.STUDENT &&
      user.role !== UserRole.TEACHER
    ) {
      throw new ForbiddenException('Only student and teacher signups can be approved');
    }

    await this.schoolLimitsService.assertCanAddUser(schoolId, user.role);
    user.isActive = true;
    user.signupPendingAt = null;
    await this.usersRepository.save(user);
    return { success: true, userId: user.id };
  }

  private toPendingRow(u: User) {
    return {
      id: u.id,
      email: u.email,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      grade: u.grade,
      section: u.section,
      parentEmail: u.parentEmail,
      signupPendingAt: u.signupPendingAt!.toISOString(),
      createdAt: u.createdAt.toISOString(),
    };
  }
}
