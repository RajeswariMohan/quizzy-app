import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { UserSession } from '@database/entities/user-session.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { ParentStudentLinkModule } from '../parent/parent-student-link.module';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Quiz, Question, StudentResponse, UserSession]),
    AuthModule,
    ParentStudentLinkModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
