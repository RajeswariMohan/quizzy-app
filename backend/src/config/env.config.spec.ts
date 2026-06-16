import { ConfigService } from '@nestjs/config';
import {
  getBullMqRedisConnection,
  getPostgresConnectionOptions,
  parseRedisUrl,
  resolvePostgresSsl,
} from './env.config';

function mockConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: (key: string, defaultValue?: string) => values[key] ?? defaultValue,
  } as ConfigService;
}

describe('env.config', () => {
  describe('getPostgresConnectionOptions', () => {
    it('uses DATABASE_URL when set', () => {
      const config = mockConfig({
        DATABASE_URL: 'postgresql://quizzy:secret@db.example.com:5433/quizzy',
        DATABASE_HOST: 'ignored',
      });

      expect(getPostgresConnectionOptions(config)).toEqual({
        type: 'postgres',
        url: 'postgresql://quizzy:secret@db.example.com:5433/quizzy',
        extra: {
          max: 10,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
        },
      });
    });

    it('enables SSL for Neon URLs', () => {
      const config = mockConfig({
        DATABASE_URL:
          'postgresql://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require',
      });

      expect(getPostgresConnectionOptions(config)).toEqual({
        type: 'postgres',
        url: 'postgresql://user:pass@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require',
        ssl: { rejectUnauthorized: true },
        extra: {
          max: 10,
          connectionTimeoutMillis: 10000,
          idleTimeoutMillis: 30000,
        },
      });
    });

    it('respects DATABASE_SSL=true', () => {
      const config = mockConfig({
        DATABASE_URL: 'postgresql://quizzy:secret@localhost:5432/quizzy',
        DATABASE_SSL: 'true',
      });

      expect(resolvePostgresSsl(config, config.get('DATABASE_URL'))).toEqual({
        rejectUnauthorized: true,
      });
    });

    it('falls back to individual DATABASE_* vars when DATABASE_URL is unset', () => {
      const config = mockConfig({
        DATABASE_HOST: 'localhost',
        DATABASE_PORT: '5433',
        DATABASE_USER: 'quizzy',
        DATABASE_PASSWORD: 'quizzy',
        DATABASE_NAME: 'quizzy',
      });

      expect(getPostgresConnectionOptions(config)).toEqual({
        type: 'postgres',
        host: 'localhost',
        port: 5433,
        username: 'quizzy',
        password: 'quizzy',
        database: 'quizzy',
      });
    });
  });

  describe('getBullMqRedisConnection', () => {
    it('uses REDIS_URL when set', () => {
      const config = mockConfig({
        REDIS_URL: 'redis://cache.example.com:6380',
        REDIS_HOST: 'ignored',
      });

      expect(getBullMqRedisConnection(config)).toEqual({
        host: 'cache.example.com',
        port: 6380,
      });
    });

    it('parses redis URL credentials and db index', () => {
      expect(parseRedisUrl('redis://:s3cret@cache.example.com:6379/2')).toEqual({
        host: 'cache.example.com',
        port: 6379,
        password: 's3cret',
        db: 2,
      });
    });

    it('falls back to REDIS_HOST and REDIS_PORT when REDIS_URL is unset', () => {
      const config = mockConfig({
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6380',
      });

      expect(getBullMqRedisConnection(config)).toEqual({
        host: 'localhost',
        port: 6380,
      });
    });
  });
});
