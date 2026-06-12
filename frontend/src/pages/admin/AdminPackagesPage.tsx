import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchSubscriptionPackages,
  updateSubscriptionPackages,
  type SchoolSubscriptionTier,
  type SubscriptionPackageFeatures,
  type SubscriptionPackageFeatureMeta,
} from '@/api/admin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';

const TIERS: SchoolSubscriptionTier[] = ['BASIC', 'STANDARD', 'PREMIUM'];

const TIER_LABELS: Record<SchoolSubscriptionTier, string> = {
  BASIC: 'Basic',
  STANDARD: 'Standard',
  PREMIUM: 'Premium',
};

export function AdminPackagesPage() {
  const [features, setFeatures] = useState<SubscriptionPackageFeatureMeta[]>([]);
  const [templates, setTemplates] = useState<Record<
    SchoolSubscriptionTier,
    SubscriptionPackageFeatures
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchSubscriptionPackages()
      .then((data) => {
        setFeatures(data.features);
        setTemplates(data.templates);
      })
      .catch((err) => {
        logApiError('Load subscription packages failed', err);
        setError(getApiErrorMessage(err, 'Could not load package templates.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (tier: SchoolSubscriptionTier, key: keyof SubscriptionPackageFeatures) => {
    if (!templates) return;
    setTemplates({
      ...templates,
      [tier]: { ...templates[tier], [key]: !templates[tier][key] },
    });
  };

  const handleSave = async () => {
    if (!templates) return;
    setIsSaving(true);
    setError(null);
    try {
      const saved = await updateSubscriptionPackages(templates);
      setTemplates(saved);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      logApiError('Save subscription packages failed', err);
      setError(getApiErrorMessage(err, 'Could not save package templates.'));
    } finally {
      setIsSaving(false);
    }
  };

  const dirty = useMemo(() => templates !== null, [templates]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Subscription packages</h1>
        <p className="text-muted">
          Define what each package includes. Schools are mapped to a package on the Schools page.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {savedAt && (
        <p className="text-sm text-success">Saved at {new Date(savedAt).toLocaleString()}</p>
      )}

      <Card className="overflow-x-auto">
        <CardTitle>Feature matrix</CardTitle>
        <p className="mt-1 text-sm text-muted">
          Global kill switches on Features still apply — a feature off platform-wide overrides package
          settings.
        </p>
        {templates && (
          <table className="mt-4 w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-muted">
                <th className="pb-3 pr-4 font-medium">Feature</th>
                {TIERS.map((tier) => (
                  <th key={tier} className="pb-3 pr-4 font-medium text-center">
                    {TIER_LABELS[tier]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature) => (
                <tr key={feature.key} className="border-b border-gray-50">
                  <td className="py-3 pr-4 align-top">
                    <p className="font-medium text-ink">{feature.label}</p>
                    <p className="text-xs text-muted">{feature.description}</p>
                  </td>
                  {TIERS.map((tier) => (
                    <td key={tier} className="py-3 pr-4 text-center align-top">
                      <input
                        type="checkbox"
                        checked={templates[tier][feature.key]}
                        onChange={() => toggle(tier, feature.key)}
                        aria-label={`${feature.label} for ${TIER_LABELS[tier]}`}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={() => void handleSave()} disabled={isSaving || !dirty}>
            {isSaving ? 'Saving…' : 'Save package templates'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
