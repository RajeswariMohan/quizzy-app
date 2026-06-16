import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { getBullMqRedisConnection } from '../config/env.config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: getBullMqRedisConnection(configService),
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
