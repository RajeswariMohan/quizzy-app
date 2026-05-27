import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ProgressStudentsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  grade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  section?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
