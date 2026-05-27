import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSettings } from '@database/entities/platform-settings.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { School } from '@database/entities/school.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SchoolsModule } from '../school/schools.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformSettings,
      School,
      User,
      Quiz,
      StudentResponse,
    ]),
    AuthModule,
    SchoolsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
