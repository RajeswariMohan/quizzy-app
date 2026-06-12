import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { UserRole } from '@database/enums/user-role.enum';

const ONBOARD_ROLES = [UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT] as const;

export class UpdateSchoolUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsEnum(ONBOARD_ROLES)
  role?: (typeof ONBOARD_ROLES)[number];

  @ValidateIf((dto) => dto.role === UserRole.STUDENT)
  @IsOptional()
  @IsString()
  @MinLength(1)
  grade?: string;

  @ValidateIf((dto) => dto.role === UserRole.STUDENT)
  @IsOptional()
  @IsString()
  @MinLength(1)
  section?: string;

  /** Student profile: parent contact for auto-linking when parent registers */
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
