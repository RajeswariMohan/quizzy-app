import { IsEmail, IsEnum, IsString, MinLength, ValidateIf } from 'class-validator';
import { UserRole } from '@database/enums/user-role.enum';

const ONBOARD_ROLES = [UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT] as const;

export class CreateSchoolUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MinLength(1)
  firstName: string;

  @IsString()
  @MinLength(1)
  lastName: string;

  @IsEnum(ONBOARD_ROLES)
  role: (typeof ONBOARD_ROLES)[number];

  @ValidateIf((dto) => dto.role === UserRole.STUDENT)
  @IsString()
  @MinLength(1)
  grade?: string;

  @ValidateIf((dto) => dto.role === UserRole.STUDENT)
  @IsString()
  @MinLength(1)
  section?: string;
}
