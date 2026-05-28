import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

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
}
