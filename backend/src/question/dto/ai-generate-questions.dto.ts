import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class AiGenerateQuestionsDto {
  @IsString()
  @MinLength(3)
  prompt: string;

  @IsInt()
  @Min(1)
  @Max(50)
  count: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  board?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  grade?: string;

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
  sourceText?: string;
}
