import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentStudentLink } from '@database/entities/parent-student-link.entity';
import { User } from '@database/entities/user.entity';
import { ParentStudentLinkService } from './parent-student-link.service';

@Module({
  imports: [TypeOrmModule.forFeature([ParentStudentLink, User])],
  providers: [ParentStudentLinkService],
  exports: [ParentStudentLinkService],
})
export class ParentStudentLinkModule {}
