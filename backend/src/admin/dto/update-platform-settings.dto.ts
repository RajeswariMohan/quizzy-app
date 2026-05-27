import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PlatformSettingsJson } from '@database/entities/platform-settings.entity';

export class UpdatePlatformSettingsDto implements Partial<PlatformSettingsJson> {
  @IsOptional()
  @IsBoolean()
  aiGenerationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  studentLeaderboardEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  parentPortalEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  teacherQuizCreationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  gamificationEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  maintenanceMessage?: string | null;
}
