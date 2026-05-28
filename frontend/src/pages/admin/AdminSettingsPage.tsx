import { useCallback, useEffect, useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  fetchPlatformSettings,
  updatePlatformSettings,
  type PlatformFeatures,
} from '@/api/admin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';

type FeatureKey = keyof Omit<PlatformFeatures, 'maintenanceMessage'>;

const FEATURE_TOGGLES: { key: FeatureKey; label: string; description: string }[] = [
  {
    key: 'aiGenerationEnabled',
    label: 'AI question generation',
    description: 'Teachers can queue AI-generated MCQs for quizzes.',
  },
  {
    key: 'teacherQuizCreationEnabled',
    label: 'Teacher quiz creation',
    description: 'Allow teachers to create and publish quizzes.',
  },
  {
    key: 'studentLeaderboardEnabled',
    label: 'Student leaderboard',
    description: 'Show competitive rankings to students.',
  },
  {
    key: 'parentPortalEnabled',
    label: 'Parent portal',
    description: 'Parents can sign in and view linked child progress.',
  },
  {
    key: 'gamificationEnabled',
    label: 'Gamification (XP & streaks)',
    description: 'XP points and streaks on student profiles.',
  },
  {
    key: 'maintenanceMode',
    label: 'Maintenance mode',
    description: 'Restrict access during platform maintenance (future enforcement).',
  },
];

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformFeatures | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    fetchPlatformSettings()
      .then((s) => {
        setSettings(s);
        setMaintenanceMessage(s.maintenanceMessage ?? '');
        setSavedAt(s.updatedAt ?? null);
      })
      .catch((err) => {
        logApiError('Load settings failed', err);
        setError(getApiErrorMessage(err, 'Could not load settings.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (key: FeatureKey) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updatePlatformSettings({
        aiGenerationEnabled: settings.aiGenerationEnabled,
        studentLeaderboardEnabled: settings.studentLeaderboardEnabled,
        parentPortalEnabled: settings.parentPortalEnabled,
        teacherQuizCreationEnabled: settings.teacherQuizCreationEnabled,
        gamificationEnabled: settings.gamificationEnabled,
        maintenanceMode: settings.maintenanceMode,
        maintenanceMessage: maintenanceMessage.trim() || null,
      });
      setSettings(updated);
      setSavedAt(updated.updatedAt);
    } catch (err) {
      logApiError('Save settings failed', err);
      setError(getApiErrorMessage(err, 'Could not save settings.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Feature availability</h1>
        <p className="text-muted">Control which product capabilities are enabled platform-wide</p>
      </div>

      <Card>
        <CardTitle>Platform features</CardTitle>
        <ul className="mt-4 divide-y divide-gray-100">
          {FEATURE_TOGGLES.map(({ key, label, description }) => (
            <li key={key} className="flex items-start justify-between gap-4 py-4 first:pt-0">
              <div>
                <p className="font-medium text-ink">{label}</p>
                <p className="text-sm text-muted">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings[key]}
                onClick={() => toggle(key)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                  settings[key] ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    settings[key] ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Maintenance message</CardTitle>
        <textarea
          className="mt-3 min-h-[80px] w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          placeholder="Shown to users when maintenance mode is enabled"
          value={maintenanceMessage}
          onChange={(e) => setMaintenanceMessage(e.target.value)}
        />
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      {savedAt && (
        <p className="text-xs text-muted">Last saved {new Date(savedAt).toLocaleString()}</p>
      )}

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  );
}
