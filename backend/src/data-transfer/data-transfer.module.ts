import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from '@database/entities/class.entity';
import { ParentStudentLink } from '@database/entities/parent-student-link.entity';
import { PlatformSettings } from '@database/entities/platform-settings.entity';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { School } from '@database/entities/school.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { UserFeedback } from '@database/entities/user-feedback.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { AdminDataTransferController } from './admin-data-transfer.controller';
import { DataTransferService } from './data-transfer.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      School,
      User,
      Class,
      Quiz,
      Question,
      ParentStudentLink,
      StudentResponse,
      UserFeedback,
      PlatformSettings,
    ]),
    AuthModule,
  ],
  controllers: [AdminDataTransferController],
  providers: [DataTransferService],
})
export class DataTransferModule {}
