import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { School } from '@database/entities/school.entity';
import { User } from '@database/entities/user.entity';
import { UserRole } from '@database/enums/user-role.enum';

export interface SchoolUsageCounts {
  students: number;
  teachers: number;
  parents: number;
}

export interface SchoolLimitsSnapshot {
  maxStudents: number | null;
  maxTeachers: number | null;
  maxParents: number | null;
  usage: SchoolUsageCounts;
}

@Injectable()
export class SchoolLimitsService {
  constructor(
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async getUsage(schoolId: string): Promise<SchoolUsageCounts> {
    const [students, teachers, parents] = await Promise.all([
      this.usersRepository.count({
        where: { schoolId, role: UserRole.STUDENT, isActive: true },
      }),
      this.usersRepository.count({
        where: {
          schoolId,
          role: In([UserRole.TEACHER, UserRole.SCHOOL_ADMIN]),
          isActive: true,
        },
      }),
      this.usersRepository.count({
        where: { schoolId, role: UserRole.PARENT, isActive: true },
      }),
    ]);

    return { students, teachers, parents };
  }

  async getLimitsSnapshot(school: School): Promise<SchoolLimitsSnapshot> {
    const usage = await this.getUsage(school.id);
    return {
      maxStudents: school.maxStudents,
      maxTeachers: school.maxTeachers,
      maxParents: school.maxParents,
      usage,
    };
  }

  async assertCanAddUser(schoolId: string, role: UserRole): Promise<void> {
    const school = await this.schoolsRepository.findOne({ where: { id: schoolId } });
    if (!school?.isActive) {
      throw new ConflictException('School is inactive');
    }

    const usage = await this.getUsage(schoolId);

    if (role === UserRole.STUDENT && school.maxStudents != null) {
      if (usage.students >= school.maxStudents) {
        throw new ConflictException(
          `Student limit reached (${school.maxStudents}). Contact your platform administrator.`,
        );
      }
    }

    if (role === UserRole.TEACHER && school.maxTeachers != null) {
      if (usage.teachers >= school.maxTeachers) {
        throw new ConflictException(
          `Teacher limit reached (${school.maxTeachers}). Contact your platform administrator.`,
        );
      }
    }

    if (role === UserRole.SCHOOL_ADMIN && school.maxTeachers != null) {
      if (usage.teachers >= school.maxTeachers) {
        throw new ConflictException(
          `Staff limit reached (${school.maxTeachers}). Cannot add another school admin.`,
        );
      }
    }

    if (role === UserRole.PARENT && school.maxParents != null) {
      if (usage.parents >= school.maxParents) {
        throw new ConflictException(
          `Parent account limit reached (${school.maxParents}). Contact your platform administrator.`,
        );
      }
    }
  }
}
