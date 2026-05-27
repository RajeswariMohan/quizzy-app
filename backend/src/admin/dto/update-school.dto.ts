import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateSchoolDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  board?: string | null;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  primaryColor?: string;

  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  secondaryColor?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxStudents?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxTeachers?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxParents?: number | null;
}
