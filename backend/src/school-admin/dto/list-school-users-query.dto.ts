import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserRole } from '@database/enums/user-role.enum';

export enum SchoolUserStatusFilter {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ALL = 'all',
}

export class ListSchoolUsersQueryDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsEnum(SchoolUserStatusFilter)
  status?: SchoolUserStatusFilter;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;
}
