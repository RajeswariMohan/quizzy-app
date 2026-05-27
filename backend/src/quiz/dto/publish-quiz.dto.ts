import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';

export class QuizAudienceTargetDto {
  @IsString()
  @MaxLength(50)
  grade!: string;

  @IsString()
  @MaxLength(20)
  section!: string;
}

export class PublishQuizDto {
  @IsEnum(QuizAudienceScope)
  audienceScope!: QuizAudienceScope;

  @ValidateIf((o: PublishQuizDto) => o.audienceScope === QuizAudienceScope.GRADE_SECTION)
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuizAudienceTargetDto)
  targets?: QuizAudienceTargetDto[];
}
