import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiGenerationTask } from '@database/entities/ai-generation-task.entity';
import { Question } from '@database/entities/question.entity';
import { Quiz } from '@database/entities/quiz.entity';
import { AI_QUESTION_GENERATION_QUEUE } from '../queue/queue.constants';
import { AuthModule } from '../auth/auth.module';
import { SchoolsModule } from '../school/schools.module';
import { MockLlmService } from '../llm/mock-llm.service';
import { AiGenerationController } from './ai-generation.controller';
import { AiGenerationProcessor } from './ai-generation.processor';
import { AiGenerationService } from './ai-generation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiGenerationTask, Quiz, Question]),
    BullModule.registerQueue({ name: AI_QUESTION_GENERATION_QUEUE }),
    AuthModule,
    SchoolsModule,
  ],
  controllers: [AiGenerationController],
  providers: [AiGenerationService, AiGenerationProcessor, MockLlmService],
  exports: [AiGenerationService],
})
export class AiGenerationModule {}
