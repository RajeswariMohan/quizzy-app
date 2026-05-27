import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class DashboardAnalyticsQueryDto {
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
