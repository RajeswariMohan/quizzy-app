import { Type } from 'class-transformer';
import { IsBoolean, IsObject, ValidateNested } from 'class-validator';
import { SchoolSubscriptionTier } from '@database/enums/school-subscription-tier.enum';
import type { SubscriptionPackageFeatures } from '@database/constants/subscription-packages';

class SubscriptionPackageFeaturesDto implements SubscriptionPackageFeatures {
  @IsBoolean()
  publishScopeGrade: boolean;

  @IsBoolean()
  publishScopeSchool: boolean;

  @IsBoolean()
  publishScopeSection: boolean;

  @IsBoolean()
  aiGenerationEnabled: boolean;

  @IsBoolean()
  teacherQuizCreationEnabled: boolean;

  @IsBoolean()
  studentLeaderboardEnabled: boolean;

  @IsBoolean()
  parentPortalEnabled: boolean;

  @IsBoolean()
  gamificationEnabled: boolean;

  @IsBoolean()
  bulkUserImportEnabled: boolean;
}

export class UpdateSubscriptionPackagesDto {
  @IsObject()
  @ValidateNested()
  @Type(() => SubscriptionPackageFeaturesDto)
  BASIC: SubscriptionPackageFeaturesDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SubscriptionPackageFeaturesDto)
  STANDARD: SubscriptionPackageFeaturesDto;

  @IsObject()
  @ValidateNested()
  @Type(() => SubscriptionPackageFeaturesDto)
  PREMIUM: SubscriptionPackageFeaturesDto;
}

export type SubscriptionPackagesPatch = Record<
  SchoolSubscriptionTier,
  SubscriptionPackageFeatures
>;
