import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUIZZY_ENTITIES } from '@database/entities';
import { AdminModule } from './admin/admin.module';
import { AiGenerationModule } from './ai-generation/ai-generation.module';
import { AuthModule } from './auth/auth.module';
import { QuestionModule } from './question/question.module';
import { QueueModule } from './queue/queue.module';
import { QuizModule } from './quiz/quiz.module';
import { StudentModule } from './student/student.module';
import { ParentModule } from './parent/parent.module';
import { SchoolsModule } from './school/schools.module';
import { SchoolAdminModule } from './school-admin/school-admin.module';
import { ProgressModule } from './progress/progress.module';
import { EngagementModule } from './engagement/engagement.module';
import { FeedbackModule } from './feedback/feedback.module';
import { DataTransferModule } from './data-transfer/data-transfer.module';
import { ProfileModule } from './profile/profile.module';
import { AppController } from './app.controller';
import { getPostgresConnectionOptions } from './config/env.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ...getPostgresConnectionOptions(configService),
        entities: [...QUIZZY_ENTITIES],
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    QueueModule,
    AuthModule,
    QuizModule,
    StudentModule,
    ParentModule,
    QuestionModule,
    AiGenerationModule,
    AdminModule,
    SchoolsModule,
    SchoolAdminModule,
    ProgressModule,
    EngagementModule,
    FeedbackModule,
    DataTransferModule,
    ProfileModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
