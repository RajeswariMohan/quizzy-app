import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { AiGenerationModule } from '../ai-generation/ai-generation.module';
import { AuthModule } from '../auth/auth.module';
import { QuestionController } from './question.controller';
import { QuestionService } from './question.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Quiz]),
    AuthModule,
    AiGenerationModule,
  ],
  controllers: [QuestionController],
  providers: [QuestionService],
  exports: [QuestionService],
})
export class QuestionModule {}
