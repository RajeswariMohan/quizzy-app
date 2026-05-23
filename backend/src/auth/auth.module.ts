import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@database/entities/user.entity';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TenantContextService } from './services/tenant-context.service';
import { TokenService } from './services/token.service';
import { getJwtExpiresIn, getJwtSecret } from '../config/env.config';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = getJwtExpiresIn(configService);
        return {
          secret: getJwtSecret(configService),
          signOptions: {
            expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
          },
        };
      },
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    AuthService,
    TokenService,
    TenantContextService,
    JwtStrategy,
    TenantContextMiddleware,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [AuthService, TokenService, TenantContextService, TenantContextMiddleware],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'api/health', method: RequestMethod.GET },
      )
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
