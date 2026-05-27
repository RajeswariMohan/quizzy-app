import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quiz } from '@database/entities/quiz.entity';
import { School } from '@database/entities/school.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SchoolsModule } from '../school/schools.module';
import { SchoolAcademicsController } from './school-academics.controller';
import { SchoolAcademicsModule } from './school-academics.module';
import { SchoolAdminController } from './school-admin.controller';
import { SchoolAdminService } from './school-admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([School, User, Quiz, StudentResponse]),
    AuthModule,
    SchoolsModule,
    SchoolAcademicsModule,
  ],
  controllers: [SchoolAdminController, SchoolAcademicsController],
  providers: [SchoolAdminService],
  exports: [SchoolAdminService, SchoolAcademicsModule],
})
export class SchoolAdminModule {}
