import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class StudentAudienceQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  grade?: string;

  @IsOptional()
  @IsIn(['class', 'section'])
  scope?: 'class' | 'section';

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  section?: string;
}
