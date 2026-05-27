import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '@database/entities/school.entity';
import { SchoolAcademicsService } from './school-academics.service';

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  providers: [SchoolAcademicsService],
  exports: [SchoolAcademicsService],
})
export class SchoolAcademicsModule {}
