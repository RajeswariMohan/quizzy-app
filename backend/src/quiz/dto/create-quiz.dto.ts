import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateQuizDto {
  @Matches(UUID_PATTERN, { message: 'classId must be a valid UUID' })
  classId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  topic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  board?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  grade?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeLimitMinutes?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalXpReward?: number;
}
