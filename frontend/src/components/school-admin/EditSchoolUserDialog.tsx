import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  updateSchoolUser,
  type SchoolAcademicConfig,
  type SchoolUserRow,
} from '@/api/schoolAdmin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';
import {
  buildUpdatePayloadFromEditValues,
  editDialogTitle,
  isSchoolUserEditValid,
  SchoolUserEditFields,
  type SchoolUserEditValues,
} from '@/components/school-admin/SchoolUserEditFields';
import { roleLabel, type OnboardRole } from '@/utils/schoolUserOnboarding';

interface EditSchoolUserDialogProps {
  user: SchoolUserRow;
  academics: SchoolAcademicConfig | null;
  onClose: () => void;
  onSaved: () => void;
}

function toOnboardRole(role: SchoolUserRow['role']): OnboardRole | null {
  if (role === 'STUDENT' || role === 'TEACHER' || role === 'PARENT') return role;
  return null;
}

function userToEditValues(user: SchoolUserRow): SchoolUserEditValues {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    parentEmail: user.parentEmail ?? '',
    password: '',
    grade: user.grade ?? '',
    section: user.section ?? '',
  };
}

export function EditSchoolUserDialog({
  user,
  academics,
  onClose,
  onSaved,
}: EditSchoolUserDialogProps) {
  const role = toOnboardRole(user.role);
  const [values, setValues] = useState<SchoolUserEditValues>(() => userToEditValues(user));
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setValues(userToEditValues(user));
    setError(null);
  }, [user]);

  if (!role) {
    return null;
  }

  const setField = <K extends keyof SchoolUserEditValues>(
    field: K,
    value: SchoolUserEditValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const isStudent = role === 'STUDENT';
  const canSubmit = isSchoolUserEditValid(role, values, {
    academicsRequired: isStudent,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await updateSchoolUser(user.id, buildUpdatePayloadFromEditValues(role, values));
      onSaved();
      onClose();
    } catch (err) {
      logApiError('Update school user failed', err);
      setError(getApiErrorMessage(err, 'Could not update user.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
    >
      <Card className="max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle id="edit-user-title">{editDialogTitle(role)}</CardTitle>
              <Badge className="bg-primary/10 text-primary">{roleLabel(role)}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {user.firstName} {user.lastName}
            </p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-ink"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-4">
          <SchoolUserEditFields
            role={role}
            values={values}
            onChange={setField}
            username={user.username}
            academics={academics}
            disabled={isSaving}
          />
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="submit"
              disabled={isSaving || !canSubmit || (isStudent && !academics)}
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </form>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </Card>
    </div>
  );
}

function isEditableSchoolUser(role: SchoolUserRow['role']): boolean {
  return role === 'STUDENT' || role === 'TEACHER' || role === 'PARENT';
}

export { isEditableSchoolUser };
