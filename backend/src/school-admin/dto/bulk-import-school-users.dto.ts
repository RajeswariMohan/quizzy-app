import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateSchoolUserDto } from './create-school-user.dto';

export class BulkImportSchoolUsersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => CreateSchoolUserDto)
  users: CreateSchoolUserDto[];
}
