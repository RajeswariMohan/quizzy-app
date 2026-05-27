import { IsEmail, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength } from 'class-validator';

export class CreateSchoolDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug must be lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  board?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  primaryColor?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  secondaryColor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxStudents?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeachers?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParents?: number;

  /** Required: first school admin for the new tenant */
  @IsEmail()
  adminEmail: string;

  @IsString()
  @MinLength(8)
  adminPassword: string;

  @IsString()
  @MinLength(1)
  adminFirstName: string;

  @IsString()
  @MinLength(1)
  adminLastName: string;
}
