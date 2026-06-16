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

export interface PostgresUrlConnectionOptions {
  type: 'postgres';
  url: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

export interface PostgresHostConnectionOptions {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export type PostgresConnectionOptions =
  | PostgresUrlConnectionOptions
  | PostgresHostConnectionOptions;

export interface PostgresPoolExtras {
  extra?: {
    max?: number;
    connectionTimeoutMillis?: number;
    idleTimeoutMillis?: number;
  };
}

export interface RedisHostConnectionOptions {
  host: string;
  port: number;
  password?: string;
  username?: string;
  db?: number;
  tls?: Record<string, never>;
}

/** Whether TypeORM should enable TLS (required for Neon and most hosted Postgres). */
export function resolvePostgresSsl(
  configService: ConfigService,
  databaseUrl?: string,
): boolean | { rejectUnauthorized: boolean } | undefined {
  const sslEnv = configService.get<string>('DATABASE_SSL')?.trim().toLowerCase();
  if (sslEnv === 'false' || sslEnv === '0') {
    return undefined;
  }
  if (sslEnv === 'true' || sslEnv === '1') {
    return { rejectUnauthorized: true };
  }

  if (!databaseUrl) {
    return undefined;
  }

  try {
    const url = new URL(databaseUrl);
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase();
    if (
      sslMode === 'require' ||
      sslMode === 'verify-full' ||
      sslMode === 'verify-ca' ||
      url.hostname.endsWith('.neon.tech')
    ) {
      return { rejectUnauthorized: true };
    }
  } catch {
    // Not a valid URL — leave ssl unset.
  }

  return undefined;
}

/** Conservative pg pool settings for hosted Postgres (Neon, etc.). */
export function getPostgresPoolExtras(
  configService: ConfigService,
): PostgresPoolExtras {
  const databaseUrl = configService.get<string>('DATABASE_URL')?.trim();
  if (!databaseUrl) {
    return {};
  }

  const max = Number(configService.get<string>('DATABASE_POOL_MAX', '10'));
  const connectionTimeoutMillis = Number(
    configService.get<string>('DATABASE_CONNECT_TIMEOUT_MS', '10000'),
  );
  const idleTimeoutMillis = Number(
    configService.get<string>('DATABASE_IDLE_TIMEOUT_MS', '30000'),
  );

  return {
    extra: {
      max: Number.isFinite(max) && max > 0 ? max : 10,
      connectionTimeoutMillis:
        Number.isFinite(connectionTimeoutMillis) && connectionTimeoutMillis > 0
          ? connectionTimeoutMillis
          : 10000,
      idleTimeoutMillis:
        Number.isFinite(idleTimeoutMillis) && idleTimeoutMillis > 0
          ? idleTimeoutMillis
          : 30000,
    },
  };
}

/** PostgreSQL connection for TypeORM — prefers DATABASE_URL when set. */
export function getPostgresConnectionOptions(
  configService: ConfigService,
): PostgresConnectionOptions & PostgresPoolExtras {
  const databaseUrl = configService.get<string>('DATABASE_URL')?.trim();
  if (databaseUrl) {
    const ssl = resolvePostgresSsl(configService, databaseUrl);
    const pool = getPostgresPoolExtras(configService);
    return {
      ...(ssl !== undefined
        ? { type: 'postgres', url: databaseUrl, ssl }
        : { type: 'postgres', url: databaseUrl }),
      ...pool,
    };
  }

  return {
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: getDatabasePort(configService),
    username: configService.get<string>('DATABASE_USER', 'quizzy'),
    password: configService.get<string>('DATABASE_PASSWORD', 'quizzy'),
    database: configService.get<string>('DATABASE_NAME', 'quizzy'),
  };
}

/** Parse redis:// or rediss:// URLs into BullMQ/ioredis connection options. */
export function parseRedisUrl(redisUrl: string): RedisHostConnectionOptions {
  const url = new URL(redisUrl);
  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error(`REDIS_URL must use redis:// or rediss:// (got ${url.protocol})`);
  }

  const dbPath = url.pathname.replace(/^\//, '');
  const connection: RedisHostConnectionOptions = {
    host: url.hostname,
    port: url.port ? Number(url.port) : 6379,
  };

  if (url.password) {
    connection.password = decodeURIComponent(url.password);
  }
  if (url.username) {
    connection.username = decodeURIComponent(url.username);
  }
  if (dbPath) {
    connection.db = Number(dbPath);
  }
  if (url.protocol === 'rediss:') {
    connection.tls = {};
  }

  return connection;
}

/** Redis connection for BullMQ — prefers REDIS_URL when set. */
export function getBullMqRedisConnection(
  configService: ConfigService,
): RedisHostConnectionOptions {
  const redisUrl = configService.get<string>('REDIS_URL')?.trim();
  if (redisUrl) {
    return parseRedisUrl(redisUrl);
  }

  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: getRedisPort(configService),
  };
}
