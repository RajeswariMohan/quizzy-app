import { UserRole } from '@database/enums/user-role.enum';

export interface JwtPayload {
  /** User UUID */
  sub: string;
  email: string;
  role: UserRole;
  school_id: string | null;
  /** Login session id for engagement tracking */
  sid?: string;
  iat?: number;
  exp?: number;
}
