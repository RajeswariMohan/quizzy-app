import { ArrayMinSize, IsArray, IsString, MinLength } from 'class-validator';

export class UpdateSchoolAcademicsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  grades: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  sections: string[];

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  @MinLength(1, { each: true })
  subjects: string[];
}
