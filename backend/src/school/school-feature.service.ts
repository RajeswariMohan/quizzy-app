import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_SUBSCRIPTION_PACKAGES } from '@database/constants/subscription-packages';
import {
  DEFAULT_PLATFORM_SETTINGS,
  PLATFORM_SETTINGS_ROW_ID,
  PlatformSettings,
  PlatformSettingsJson,
} from '@database/entities/platform-settings.entity';
import { School } from '@database/entities/school.entity';
import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';
import { SchoolSubscriptionTier } from '@database/enums/school-subscription-tier.enum';
import {
  EffectiveSchoolFeatures,
  SchoolFeatureKey,
  SubscriptionPackageFeatures,
  SubscriptionPackageTemplates,
  SUBSCRIPTION_PACKAGE_FEATURE_META,
} from './subscription-package.types';

@Injectable()
export class SchoolFeatureService {
  constructor(
    @InjectRepository(PlatformSettings)
    private readonly settingsRepository: Repository<PlatformSettings>,
    @InjectRepository(School)
    private readonly schoolsRepository: Repository<School>,
  ) {}

  async getPackageTemplates(): Promise<SubscriptionPackageTemplates> {
    const settings = await this.loadSettings();
    return normalizePackageTemplates(settings.subscriptionPackages);
  }

  async updatePackageTemplates(
    templates: SubscriptionPackageTemplates,
    updatedByUserId: string,
  ): Promise<SubscriptionPackageTemplates> {
    const row = await this.ensureSettingsRow();
    row.settings = {
      ...row.settings,
      subscriptionPackages: normalizePackageTemplates(templates),
    };
    row.updatedByUserId = updatedByUserId;
    await this.settingsRepository.save(row);
    return row.settings.subscriptionPackages!;
  }

  async getSubscriptionPackagesForAdmin(): Promise<{
    templates: SubscriptionPackageTemplates;
    features: typeof SUBSCRIPTION_PACKAGE_FEATURE_META;
  }> {
    return {
      templates: await this.getPackageTemplates(),
      features: SUBSCRIPTION_PACKAGE_FEATURE_META,
    };
  }

  async getEffectiveFeatures(schoolId: string): Promise<EffectiveSchoolFeatures> {
    const school = await this.schoolsRepository.findOne({
      where: { id: schoolId },
      select: ['id', 'subscriptionTier'],
    });
    if (!school) {
      throw new NotFoundException('School not found');
    }
    const settings = await this.loadSettings();
    const tier = resolveTier(school.subscriptionTier);
    const packageFeatures = normalizePackageTemplates(settings.subscriptionPackages)[tier];
    const merged = mergeEffectiveFeatures(settings, packageFeatures);
    return {
      subscriptionTier: tier,
      ...merged,
      allowedPublishScopes: this.allowedPublishScopes(merged),
    };
  }

  async assertFeature(schoolId: string, feature: SchoolFeatureKey): Promise<void> {
    const effective = await this.getEffectiveFeatures(schoolId);
    if (!effective[feature]) {
      throw new ForbiddenException(
        `This action is not included in your school's ${effective.subscriptionTier.toLowerCase()} package. Contact your platform administrator.`,
      );
    }
  }

  allowedPublishScopes(features: SubscriptionPackageFeatures): QuizAudienceScope[] {
    const scopes: QuizAudienceScope[] = [];
    if (features.publishScopeSchool) scopes.push(QuizAudienceScope.SCHOOL);
    if (features.publishScopeGrade) scopes.push(QuizAudienceScope.GRADE);
    if (features.publishScopeSection) scopes.push(QuizAudienceScope.GRADE_SECTION);
    return scopes;
  }

  async assertPublishScopeAllowed(
    schoolId: string,
    scope: QuizAudienceScope,
  ): Promise<void> {
    const effective = await this.getEffectiveFeatures(schoolId);
    if (!effective.allowedPublishScopes.includes(scope)) {
      if (scope === QuizAudienceScope.GRADE_SECTION) {
        throw new ForbiddenException(
          'Section-level publishing requires a Premium school package. Contact your platform administrator.',
        );
      }
      if (scope === QuizAudienceScope.SCHOOL) {
        throw new ForbiddenException(
          'School-wide publishing is not available on your school package. Publish to a grade instead.',
        );
      }
      throw new ForbiddenException(
        'This publish scope is not available for your school package.',
      );
    }
  }

  private async loadSettings(): Promise<PlatformSettingsJson> {
    const row = await this.ensureSettingsRow();
    return row.settings;
  }

  private async ensureSettingsRow(): Promise<PlatformSettings> {
    let row = await this.settingsRepository.findOne({
      where: { id: PLATFORM_SETTINGS_ROW_ID },
    });
    if (!row) {
      row = this.settingsRepository.create({
        id: PLATFORM_SETTINGS_ROW_ID,
        settings: { ...DEFAULT_PLATFORM_SETTINGS },
      });
      await this.settingsRepository.save(row);
    } else if (!row.settings.subscriptionPackages) {
      row.settings = {
        ...row.settings,
        subscriptionPackages: { ...DEFAULT_SUBSCRIPTION_PACKAGES },
      };
      await this.settingsRepository.save(row);
    }
    return row;
  }
}

function resolveTier(tier: SchoolSubscriptionTier | string | null | undefined): SchoolSubscriptionTier {
  if (
    tier === SchoolSubscriptionTier.BASIC ||
    tier === SchoolSubscriptionTier.STANDARD ||
    tier === SchoolSubscriptionTier.PREMIUM
  ) {
    return tier;
  }
  return SchoolSubscriptionTier.STANDARD;
}

function normalizePackageTemplates(
  raw: SubscriptionPackageTemplates | undefined,
): SubscriptionPackageTemplates {
  const base = raw ?? DEFAULT_SUBSCRIPTION_PACKAGES;
  return {
    BASIC: { ...DEFAULT_SUBSCRIPTION_PACKAGES.BASIC, ...base.BASIC },
    STANDARD: { ...DEFAULT_SUBSCRIPTION_PACKAGES.STANDARD, ...base.STANDARD },
    PREMIUM: { ...DEFAULT_SUBSCRIPTION_PACKAGES.PREMIUM, ...base.PREMIUM },
  };
}

function mergeEffectiveFeatures(
  global: PlatformSettingsJson,
  pkg: SubscriptionPackageFeatures,
): SubscriptionPackageFeatures {
  return {
    publishScopeGrade: pkg.publishScopeGrade,
    publishScopeSchool: pkg.publishScopeSchool,
    publishScopeSection: pkg.publishScopeSection,
    aiGenerationEnabled: global.aiGenerationEnabled && pkg.aiGenerationEnabled,
    teacherQuizCreationEnabled:
      global.teacherQuizCreationEnabled && pkg.teacherQuizCreationEnabled,
    studentLeaderboardEnabled:
      global.studentLeaderboardEnabled && pkg.studentLeaderboardEnabled,
    parentPortalEnabled: global.parentPortalEnabled && pkg.parentPortalEnabled,
    gamificationEnabled: global.gamificationEnabled && pkg.gamificationEnabled,
    bulkUserImportEnabled: pkg.bulkUserImportEnabled,
  };
}
