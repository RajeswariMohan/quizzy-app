import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { FeedbackStatus } from '@database/enums/feedback-status.enum';

export class UpdateFeedbackDto {
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  adminNotes?: string;
}
