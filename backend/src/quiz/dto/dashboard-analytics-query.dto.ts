import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { QuizStatus } from '@database/enums/quiz-status.enum';

export class DashboardAnalyticsQueryDto {
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim();
    if (!normalized || normalized.toLowerCase() === 'all') return undefined;
    return normalized;
  })
  @IsOptional()
  @IsUUID()
  createdByUserId?: string;
  @IsOptional()
  @IsString()
  @MaxLength(20)
  grade?: string;

  /** Student section / senior department (or composite "Dept · A") */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  section?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  board?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  topic?: string;

  /** Inclusive start date (YYYY-MM-DD), filters quiz created_at */
  @IsOptional()
  @IsDateString({ strict: true })
  dateFrom?: string;

  /** Inclusive end date (YYYY-MM-DD), filters quiz created_at */
  @IsOptional()
  @IsDateString({ strict: true })
  dateTo?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const normalized = value.trim().toUpperCase();
    if (!normalized || normalized === 'ALL') return undefined;
    return normalized;
  })
  @IsOptional()
  @IsEnum(QuizStatus)
  status?: QuizStatus;
}
