import { ConfigService } from '@nestjs/config';

export function getJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');
  if (!secret?.trim()) {
    throw new Error(
      'JWT_SECRET is not configured. Copy backend/.env.example to backend/.env and set JWT_SECRET.',
    );
  }
  return secret;
}

export function getJwtExpiresIn(configService: ConfigService): string {
  return configService.get<string>('JWT_EXPIRES_IN') ?? '1d';
}

export function getDatabasePort(configService: ConfigService): number {
  return Number(configService.get<string>('DATABASE_PORT', '5432'));
}

export function getRedisPort(configService: ConfigService): number {
  return Number(configService.get<string>('REDIS_PORT', '6379'));
}
