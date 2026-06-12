import {
  ArrayMinSize,
  IsArray,
  IsObject,
  IsString,
  MinLength,
} from 'class-validator';

export class UpdateSchoolAcademicsDto {
  @IsObject()
  gradeSections!: Record<string, string[]>;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  subjects: string[];
}
