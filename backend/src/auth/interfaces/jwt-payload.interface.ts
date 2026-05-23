import { UserRole } from '@database/enums/user-role.enum';

export interface JwtPayload {
  /** User UUID */
  sub: string;
  email: string;
  role: UserRole;
  school_id: string | null;
  iat?: number;
  exp?: number;
}
