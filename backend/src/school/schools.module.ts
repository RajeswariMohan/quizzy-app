import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '@database/entities/school.entity';
import { User } from '@database/entities/user.entity';
import { SchoolsController } from './schools.controller';
import { SchoolLimitsService } from './school-limits.service';

@Module({
  imports: [TypeOrmModule.forFeature([School, User])],
  controllers: [SchoolsController],
  providers: [SchoolLimitsService],
  exports: [SchoolLimitsService],
})
export class SchoolsModule {}
