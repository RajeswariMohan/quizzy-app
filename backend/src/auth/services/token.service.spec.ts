import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UserRole } from '@database/enums/user-role.enum';
import { SCHOOL_ID, TEACHER_ID } from '../../../test/helpers/constants';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'unit-test-jwt-secret',
          signOptions: { expiresIn: '1h' },
        }),
      ],
      providers: [
        TokenService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'unit-test-jwt-secret';
              if (key === 'JWT_EXPIRES_IN') return '1h';
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    tokenService = module.get(TokenService);
  });

  it('signs and verifies access tokens with school_id claim', async () => {
    const token = tokenService.signAccessToken({
      id: TEACHER_ID,
      email: 'teacher@test.school',
      role: UserRole.TEACHER,
      schoolId: SCHOOL_ID,
    });

    const payload = await tokenService.verifyAccessToken(token);
    expect(payload.sub).toBe(TEACHER_ID);
    expect(payload.school_id).toBe(SCHOOL_ID);
    expect(payload.role).toBe(UserRole.TEACHER);
  });
});
