import { IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '@database/enums/user-role.enum';

export enum SchoolUserStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ALL = 'all',
}

export class ListSchoolUsersQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(SchoolUserStatusFilter)
  status?: SchoolUserStatusFilter;
}
