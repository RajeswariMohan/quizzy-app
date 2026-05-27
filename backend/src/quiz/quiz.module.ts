import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from '@database/entities/class.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { StudentResponse } from '@database/entities/student-response.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SchoolAcademicsModule } from '../school-admin/school-academics.module';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Quiz, Class, StudentResponse, User]),
    AuthModule,
    SchoolAcademicsModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
  exports: [QuizService],
})
export class QuizModule {}
