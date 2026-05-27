import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateManualQuestionDto {
  @IsString()
  @MinLength(1)
  questionText: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  options: string[];

  @IsInt()
  @Min(0)
  @Max(3)
  correctOptionIndex: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  difficulty?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number;
}
