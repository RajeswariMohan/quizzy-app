import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { QUIZ_BOARDS } from '../../common/constants/academics';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CreateQuizDto {
  @ValidateIf((dto: CreateQuizDto) => !dto.grade)
  @Matches(UUID_PATTERN, { message: 'classId must be a valid UUID' })
  classId?: string;

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
  @IsIn([...QUIZ_BOARDS])
  board?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
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
