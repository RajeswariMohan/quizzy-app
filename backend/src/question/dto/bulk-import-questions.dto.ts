import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateManualQuestionDto } from './create-manual-question.dto';

export class BulkImportQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => CreateManualQuestionDto)
  questions: CreateManualQuestionDto[];
}
