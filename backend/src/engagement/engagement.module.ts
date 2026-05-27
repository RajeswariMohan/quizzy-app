import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSession } from '@database/entities/user-session.entity';
import { User } from '@database/entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { EngagementController } from './engagement.controller';
import { EngagementService } from './engagement.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserSession, User]), AuthModule],
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
