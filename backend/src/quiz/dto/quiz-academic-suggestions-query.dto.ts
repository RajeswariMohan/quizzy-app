import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class QuizAcademicSuggestionsQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  subject: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  grade?: string;
}
