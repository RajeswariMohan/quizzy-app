import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@database/entities/user.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { getJwtExpiresIn, getJwtSecret } from '../../config/env.config';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  signAccessToken(
    user: Pick<User, 'id' | 'email' | 'role' | 'schoolId'>,
    sessionId?: string,
  ): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      school_id: user.schoolId,
      ...(sessionId ? { sid: sessionId } : {}),
    };

    const expiresIn = getJwtExpiresIn(this.configService);

    return this.jwtService.sign(
      { ...payload },
      {
        secret: this.getSecret(),
        expiresIn: expiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    );
  }

  async verifyAccessToken(token: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, {
      secret: this.getSecret(),
    });
  }

  getSecret(): string {
    return getJwtSecret(this.configService);
  }
}
