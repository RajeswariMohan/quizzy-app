import { BadRequestException } from '@nestjs/common';
import { QuizAudienceScope } from '@database/enums/quiz-audience-scope.enum';
import { SchoolSubscriptionTier } from '@database/enums/school-subscription-tier.enum';
import { DEFAULT_SUBSCRIPTION_PACKAGES } from '@database/constants/subscription-packages';

/** @deprecated Use SchoolFeatureService.assertPublishScopeAllowed for runtime checks */
export function assertPublishScopeAllowed(
  tier: SchoolSubscriptionTier,
  scope: QuizAudienceScope,
): void {
  const pkg = DEFAULT_SUBSCRIPTION_PACKAGES[tier] ?? DEFAULT_SUBSCRIPTION_PACKAGES.STANDARD;
  if (scope === QuizAudienceScope.GRADE_SECTION && !pkg.publishScopeSection) {
    throw new BadRequestException(
      'Section-level publishing requires a Premium school package. Contact your platform administrator.',
    );
  }
  if (scope === QuizAudienceScope.SCHOOL && !pkg.publishScopeSchool) {
    throw new BadRequestException(
      'School-wide publishing is not available on the Basic package. Publish to a grade instead.',
    );
  }
}

/** @deprecated Use SchoolFeatureService.getEffectiveFeatures().allowedPublishScopes */
export function allowedPublishScopes(
  tier: SchoolSubscriptionTier,
): QuizAudienceScope[] {
  const pkg = DEFAULT_SUBSCRIPTION_PACKAGES[tier] ?? DEFAULT_SUBSCRIPTION_PACKAGES.STANDARD;
  const scopes: QuizAudienceScope[] = [];
  if (pkg.publishScopeSchool) scopes.push(QuizAudienceScope.SCHOOL);
  if (pkg.publishScopeGrade) scopes.push(QuizAudienceScope.GRADE);
  if (pkg.publishScopeSection) scopes.push(QuizAudienceScope.GRADE_SECTION);
  return scopes;
}
