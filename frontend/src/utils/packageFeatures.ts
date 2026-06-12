import type {
  SchoolSubscriptionTier,
  SubscriptionPackageFeatureMeta,
  SubscriptionPackageFeatures,
} from '@/api/admin.api';

export function enabledPackageFeatures(
  tier: SchoolSubscriptionTier,
  templates: Record<SchoolSubscriptionTier, SubscriptionPackageFeatures>,
  meta: SubscriptionPackageFeatureMeta[],
): SubscriptionPackageFeatureMeta[] {
  const pkg = templates[tier];
  return meta.filter((feature) => pkg[feature.key]);
}

export function formatTierLabel(tier: SchoolSubscriptionTier): string {
  if (tier === 'BASIC') return 'Basic';
  if (tier === 'PREMIUM') return 'Premium';
  return 'Standard';
}
