import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QUIZZY_ENTITIES } from '@database/entities';
import { AiGenerationModule } from './ai-generation/ai-generation.module';
import { AuthModule } from './auth/auth.module';
import { QuestionModule } from './question/question.module';
import { QueueModule } from './queue/queue.module';
import { QuizModule } from './quiz/quiz.module';
import { AppController } from './app.controller';

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
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST', 'localhost'),
        port: Number(configService.get<string>('DATABASE_PORT', '5432')),
        username: configService.get<string>('DATABASE_USER', 'quizzy'),
        password: configService.get<string>('DATABASE_PASSWORD', 'quizzy'),
        database: configService.get<string>('DATABASE_NAME', 'quizzy'),
        entities: [...QUIZZY_ENTITIES],
        synchronize: false,
        autoLoadEntities: true,
      }),
    }),
    QueueModule,
    AuthModule,
    QuizModule,
    QuestionModule,
    AiGenerationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
