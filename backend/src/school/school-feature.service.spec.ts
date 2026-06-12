import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DEFAULT_SUBSCRIPTION_PACKAGES } from '@database/constants/subscription-packages';
import {
  DEFAULT_PLATFORM_SETTINGS,
  PLATFORM_SETTINGS_ROW_ID,
} from '@database/entities/platform-settings.entity';
import { PlatformSettings } from '@database/entities/platform-settings.entity';
import { School } from '@database/entities/school.entity';
import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';
import { SchoolSubscriptionTier } from '@database/enums/school-subscription-tier.enum';
import { SCHOOL_ID } from '../../test/helpers/constants';
import { SchoolFeatureService } from './school-feature.service';

describe('SchoolFeatureService', () => {
  let service: SchoolFeatureService;
  let settingsFindOne: jest.Mock;
  let settingsSave: jest.Mock;
  let schoolFindOne: jest.Mock;

  const baseSettings = {
    id: PLATFORM_SETTINGS_ROW_ID,
    settings: { ...DEFAULT_PLATFORM_SETTINGS },
    updatedAt: new Date(),
    updatedByUserId: null,
  };

  beforeEach(async () => {
    settingsFindOne = jest.fn().mockResolvedValue({ ...baseSettings, settings: { ...baseSettings.settings } });
    settingsSave = jest.fn(async (row) => row);
    schoolFindOne = jest.fn().mockResolvedValue({
      id: SCHOOL_ID,
      subscriptionTier: SchoolSubscriptionTier.BASIC,
    });

    const module = await Test.createTestingModule({
      providers: [
        SchoolFeatureService,
        {
          provide: getRepositoryToken(PlatformSettings),
          useValue: {
            findOne: settingsFindOne,
            create: jest.fn((data) => data),
            save: settingsSave,
          },
        },
        {
          provide: getRepositoryToken(School),
          useValue: { findOne: schoolFindOne },
        },
      ],
    }).compile();

    service = module.get(SchoolFeatureService);
  });

  it('merges global kill switch with package template', async () => {
    settingsFindOne.mockResolvedValue({
      ...baseSettings,
      settings: {
        ...DEFAULT_PLATFORM_SETTINGS,
        aiGenerationEnabled: false,
        subscriptionPackages: DEFAULT_SUBSCRIPTION_PACKAGES,
      },
    });

    const features = await service.getEffectiveFeatures(SCHOOL_ID);
    expect(features.aiGenerationEnabled).toBe(false);
    expect(features.publishScopeGrade).toBe(true);
    expect(features.publishScopeSchool).toBe(false);
    expect(features.subscriptionTier).toBe(SchoolSubscriptionTier.BASIC);
  });

  it('assertPublishScopeAllowed rejects section publish on Basic tier', async () => {
    await expect(
      service.assertPublishScopeAllowed(SCHOOL_ID, QuizAudienceScope.GRADE_SECTION),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('assertFeature throws when package disables feature', async () => {
    await expect(
      service.assertFeature(SCHOOL_ID, 'aiGenerationEnabled'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when school is missing', async () => {
    schoolFindOne.mockResolvedValue(null);
    await expect(service.getEffectiveFeatures(SCHOOL_ID)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('updates package templates', async () => {
    const updated = {
      ...DEFAULT_SUBSCRIPTION_PACKAGES,
      BASIC: {
        ...DEFAULT_SUBSCRIPTION_PACKAGES.BASIC,
        bulkUserImportEnabled: true,
      },
    };

    const result = await service.updatePackageTemplates(updated, 'admin-user-id');
    expect(result.BASIC.bulkUserImportEnabled).toBe(true);
    expect(settingsSave).toHaveBeenCalled();
  });
});
