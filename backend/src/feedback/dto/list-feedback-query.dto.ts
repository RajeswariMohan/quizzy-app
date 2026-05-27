import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { FeedbackStatus } from '@database/enums/feedback-status.enum';
import { UserRole } from '@database/enums/user-role.enum';

export class ListFeedbackQueryDto {
  @IsOptional()
  @IsEnum(FeedbackStatus)
  status?: FeedbackStatus;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsUUID()
  schoolId?: string;
}
