import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { UserRole } from '@database/enums/user-role.enum';

const SIGNUP_ROLES = [UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER] as const;

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

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
  @IsString()
  schoolId?: string;

  /** Student signup: unique login id within the selected school */
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  board?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  /** Student signup: parent contact email for auto-linking when parent registers */
  @IsOptional()
  @IsEmail()
  parentEmail?: string;

  /** Student signup: required when school is the unlisted / "Other" tenant */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  signupSchoolNote?: string;

  /** @deprecated Parent auto-link uses parent email entered on student signup */
  @IsOptional()
  @IsEmail()
  studentEmail?: string;

  /** School join link slug — required to register at an onboarded school (pending approval). */
  @IsOptional()
  @IsString()
  schoolSlug?: string;
}
