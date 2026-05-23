import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@database/enums/user-role.enum';
import { ROLES_KEY } from '../constants/auth.constants';

/** Restricts a route to one or more UserRole values (use with RolesGuard). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
