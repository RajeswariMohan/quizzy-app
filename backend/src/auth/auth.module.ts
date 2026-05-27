import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { School } from '@database/entities/school.entity';
import { UserSession } from '@database/entities/user-session.entity';
import { User } from '@database/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RolesGuard } from './guards/roles.guard';
import { TenantContextMiddleware } from './middleware/tenant-context.middleware';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PasswordService } from './services/password.service';
import { TenantContextService } from './services/tenant-context.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { ParentStudentLinkModule } from '../parent/parent-student-link.module';
import { SchoolsModule } from '../school/schools.module';
import { SchoolAcademicsModule } from '../school-admin/school-academics.module';
import { getJwtExpiresIn, getJwtSecret } from '../config/env.config';

@Module({
  imports: [
    ConfigModule,
    SchoolAcademicsModule,
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
    TypeOrmModule.forFeature([User, School, UserSession]),
    ParentStudentLinkModule,
    SchoolsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    TenantContextService,
    JwtStrategy,
    TenantContextMiddleware,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
  exports: [
    AuthService,
    TokenService,
    SessionService,
    TenantContextService,
    TenantContextMiddleware,
    PasswordService,
  ],
})
export class AuthModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantContextMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'api/health', method: RequestMethod.GET },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/register', method: RequestMethod.POST },
        { path: 'auth/register-academics', method: RequestMethod.GET },
        { path: 'auth/dev/token', method: RequestMethod.POST },
        { path: 'api/auth/login', method: RequestMethod.POST },
        { path: 'api/auth/register', method: RequestMethod.POST },
        { path: 'api/auth/register-academics', method: RequestMethod.GET },
        { path: 'api/auth/dev/token', method: RequestMethod.POST },
      )
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
