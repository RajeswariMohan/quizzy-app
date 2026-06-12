import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import {
  boardFromApiValue,
  boardSelectOptions,
  boardToApiValue,
} from '@/constants/academics';
import {
  updateSchool,
  type SchoolPlatformStats,
  type SchoolSubscriptionTier,
  type SubscriptionPackageFeatureMeta,
  type SubscriptionPackageFeatures,
} from '@/api/admin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import { enabledPackageFeatures, formatTierLabel } from '@/utils/packageFeatures';

const TIERS: SchoolSubscriptionTier[] = ['BASIC', 'STANDARD', 'PREMIUM'];

interface EditSchoolDialogProps {
  school: SchoolPlatformStats;
  packageTemplates: Record<SchoolSubscriptionTier, SubscriptionPackageFeatures> | null;
  packageMeta: SubscriptionPackageFeatureMeta[];
  onClose: () => void;
  onSaved: () => void;
}

function parseLimitInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

export function EditSchoolDialog({
  school,
  packageTemplates,
  packageMeta,
  onClose,
  onSaved,
}: EditSchoolDialogProps) {
  const [name, setName] = useState(school.name);
  const [board, setBoard] = useState(() => boardFromApiValue(school.board));
  const [subscriptionTier, setSubscriptionTier] = useState<SchoolSubscriptionTier>(
    school.subscriptionTier ?? 'STANDARD',
  );
  const [maxStudents, setMaxStudents] = useState(
    school.limits?.maxStudents != null ? String(school.limits.maxStudents) : '',
  );
  const [maxTeachers, setMaxTeachers] = useState(
    school.limits?.maxTeachers != null ? String(school.limits.maxTeachers) : '',
  );
  const [maxParents, setMaxParents] = useState(
    school.limits?.maxParents != null ? String(school.limits.maxParents) : '',
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const boardOptions = useMemo(
    () => boardSelectOptions(school.board),
    [school.board],
  );

  useEffect(() => {
    setName(school.name);
    setBoard(boardFromApiValue(school.board));
    setSubscriptionTier(school.subscriptionTier ?? 'STANDARD');
    setMaxStudents(school.limits?.maxStudents != null ? String(school.limits.maxStudents) : '');
    setMaxTeachers(school.limits?.maxTeachers != null ? String(school.limits.maxTeachers) : '');
    setMaxParents(school.limits?.maxParents != null ? String(school.limits.maxParents) : '');
    setError(null);
  }, [school]);

  const tierFeatures = useMemo(
    () =>
      packageTemplates
        ? enabledPackageFeatures(subscriptionTier, packageTemplates, packageMeta)
        : [],
    [subscriptionTier, packageTemplates, packageMeta],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('School name must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await updateSchool(school.id, {
        name: trimmedName,
        board: boardToApiValue(board),
        subscriptionTier,
        maxStudents: parseLimitInput(maxStudents),
        maxTeachers: parseLimitInput(maxTeachers),
        maxParents: parseLimitInput(maxParents),
      });
      onSaved();
      onClose();
    } catch (err) {
      logApiError('Update school failed', err);
      setError(getApiErrorMessage(err, 'Could not save school.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-school-title"
    >
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle id="edit-school-title">Edit school</CardTitle>
            <p className="mt-1 text-sm text-muted">
              Slug <span className="font-mono text-ink">{school.slug}</span> cannot be changed.
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-muted hover:bg-gray-100"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink">School name</label>
            <input
              required
              minLength={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <FieldSelect
            label="Board"
            value={board}
            options={boardOptions}
            onChange={setBoard}
          />

          <FieldSelect
            label="Subscription package"
            value={subscriptionTier}
            options={TIERS}
            onChange={(v) => setSubscriptionTier(v as SchoolSubscriptionTier)}
          />

          {tierFeatures.length > 0 && (
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2">
              <p className="text-xs font-medium text-ink">{formatTierLabel(subscriptionTier)} includes</p>
              <ul className="mt-1 list-inside list-disc text-xs text-muted">
                {tierFeatures.map((f) => (
                  <li key={f.key}>{f.label}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-ink">User capacity</p>
            <p className="mb-2 text-xs text-muted">Leave blank for no cap on that role.</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Max students</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Unlimited"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Max teachers</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Unlimited"
                  value={maxTeachers}
                  onChange={(e) => setMaxTeachers(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Max parents</label>
                <input
                  type="number"
                  min={1}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                  placeholder="Unlimited"
                  value={maxParents}
                  onChange={(e) => setMaxParents(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
