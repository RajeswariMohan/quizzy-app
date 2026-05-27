import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserFeedback } from '@database/entities/user-feedback.entity';
import { User } from '@database/entities/user.entity';
import { School } from '@database/entities/school.entity';
import { AuthModule } from '../auth/auth.module';
import { FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserFeedback, User, School]), AuthModule],
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
