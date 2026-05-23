import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { TenantContext } from './interfaces/tenant-context.interface';
import { TenantContextService } from './services/tenant-context.service';
import { TokenService } from './services/token.service';

export interface AuthTokensResponse {
  accessToken: string;
  tokenType: 'Bearer';
  tenant: TenantContext;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly tokenService: TokenService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  /**
   * Issues a signed JWT after credential verification.
   * Password hashing integration belongs in the login flow (bcrypt/argon2).
   */
  async issueTokensForUser(userId: string): Promise<AuthTokensResponse> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['school'],
    });

    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.school && !user.school.isActive) {
      throw new UnauthorizedException('School tenant is inactive');
    }

    const accessToken = this.tokenService.signAccessToken(user);
    const tenant = this.tenantContextService.toTenantContext(
      user.id,
      user.email,
      user.role,
      user.schoolId,
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      tenant,
    };
  }
}
