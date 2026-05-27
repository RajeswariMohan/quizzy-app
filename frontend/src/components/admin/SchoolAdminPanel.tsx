import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  createSchoolAdmin,
  fetchSchoolAdmins,
  updateSchoolAdmin,
  type SchoolAdminRow,
} from '@/api/admin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';

interface SchoolAdminPanelProps {
  schoolId: string;
  schoolName: string;
}

export function SchoolAdminPanel({ schoolId, schoolName }: SchoolAdminPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [admins, setAdmins] = useState<SchoolAdminRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const load = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchSchoolAdmins(schoolId)
      .then(setAdmins)
      .catch((err) => {
        logApiError('Load school admins failed', err);
        setError(getApiErrorMessage(err, 'Could not load school admins.'));
      })
      .finally(() => setIsLoading(false));
  }, [schoolId]);

  useEffect(() => {
    if (expanded) load();
  }, [expanded, load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);
    try {
      await createSchoolAdmin(schoolId, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
      });
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      load();
    } catch (err) {
      logApiError('Create school admin failed', err);
      setFormError(getApiErrorMessage(err, 'Could not create school admin.'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (admin: SchoolAdminRow) => {
    try {
      await updateSchoolAdmin(schoolId, admin.id, { isActive: !admin.isActive });
      load();
    } catch (err) {
      logApiError('Update school admin failed', err);
      setError(getApiErrorMessage(err, 'Could not update school admin.'));
    }
  };

  return (
    <div className="mt-4 border-t border-gray-100 pt-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-left text-sm font-medium text-ink"
        onClick={() => setExpanded((e) => !e)}
      >
        <span>Manage school admins{expanded && !isLoading ? ` (${admins.length})` : ''}</span>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          {error && <p className="text-xs text-danger">{error}</p>}

          {isLoading ? (
            <p className="text-xs text-muted">Loading…</p>
          ) : admins.length === 0 ? (
            <p className="text-xs text-muted">No school admin yet for {schoolName}.</p>
          ) : (
            <ul className="space-y-2">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-gray-50 px-2 py-1.5 text-xs"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {admin.firstName} {admin.lastName}
                      {!admin.isActive && (
                        <span className="ml-1 text-muted">(inactive)</span>
                      )}
                    </p>
                    <p className="text-muted">{admin.email}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => void toggleActive(admin)}
                  >
                    {admin.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={(e) => void handleCreate(e)} className="grid gap-2 sm:grid-cols-2">
            <input
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <input
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
            <input
              type="email"
              className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs sm:col-span-2"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              wrapperClassName="sm:col-span-2"
              className="rounded-lg px-2 py-1.5 text-xs"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? 'Creating…' : 'Add school admin'}
              </Button>
            </div>
          </form>
          {formError && <p className="text-xs text-danger">{formError}</p>}
        </div>
      )}
    </div>
  );
}
