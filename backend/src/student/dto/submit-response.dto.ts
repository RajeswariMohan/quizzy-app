import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { UUID_PATTERN } from '../../common/uuid.pattern';

export class SubmitResponseDto {
  @Matches(UUID_PATTERN, { message: 'questionId must be a valid UUID' })
  questionId: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  selectedOptionIndex: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpentSeconds?: number;
}
