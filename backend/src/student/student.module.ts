import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SchoolsModule } from '../school/schools.module';
import { SchoolAcademicsModule } from '../school-admin/school-academics.module';
import { StudentQuizController } from './student-quiz.controller';
import { StudentQuizService } from './student-quiz.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, Question, StudentResponse, User]),
    AuthModule,
    SchoolsModule,
    SchoolAcademicsModule,
  ],
  controllers: [StudentQuizController],
  providers: [StudentQuizService],
  exports: [StudentQuizService],
})
export class StudentModule {}
