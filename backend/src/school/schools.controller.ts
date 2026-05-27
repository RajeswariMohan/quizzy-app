import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '@database/entities/school.entity';
import { UserRole } from '@database/enums/user-role.enum';
import { Roles } from '../auth';

@Controller('schools')
@Roles(UserRole.SUPER_ADMIN)
export class SchoolsController {
  constructor(
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
  ) {}

  @Get()
  async list() {
    const schools = await this.schoolsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return schools.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      primaryColor: s.primaryColor,
      secondaryColor: s.secondaryColor,
    }));
  }
}
