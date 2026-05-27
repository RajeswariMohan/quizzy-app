import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { UserRole } from '@database/enums/user-role.enum';

const SIGNUP_ROLES = [UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER] as const;

export class RegisterDto {
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

  @IsEnum(SIGNUP_ROLES)
  role: (typeof SIGNUP_ROLES)[number];

  @IsOptional()
  @IsUUID()
  schoolId?: string;

  @IsOptional()
  @IsString()
  board?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  /** Parent signup: link to an existing student in the same school by email */
  @IsOptional()
  @IsEmail()
  studentEmail?: string;
}
