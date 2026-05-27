import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { PasswordInput } from '@/components/ui/PasswordInput';
import {
  updateSchoolUser,
  type SchoolAcademicConfig,
  type SchoolUserRow,
  type UpdateSchoolUserPayload,
} from '@/api/schoolAdmin.api';
import { getApiErrorMessage, logApiError } from '@/api/client';

interface EditSchoolUserDialogProps {
  user: SchoolUserRow;
  academics: SchoolAcademicConfig | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditSchoolUserDialog({
  user,
  academics,
  onClose,
  onSaved,
}: EditSchoolUserDialogProps) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<'TEACHER' | 'STUDENT' | 'PARENT'>(
    user.role === 'STUDENT' || user.role === 'TEACHER' || user.role === 'PARENT'
      ? user.role
      : 'STUDENT',
  );
  const [grade, setGrade] = useState(user.grade ?? '');
  const [section, setSection] = useState(user.section ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
    setRole(
      user.role === 'STUDENT' || user.role === 'TEACHER' || user.role === 'PARENT'
        ? user.role
        : 'STUDENT',
    );
    setGrade(user.grade ?? '');
    setSection(user.section ?? '');
    setPassword('');
    setError(null);
  }, [user]);

  const isStudent = role === 'STUDENT';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload: UpdateSchoolUserPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        role,
      };
      if (isStudent) {
        payload.grade = grade;
        payload.section = section;
      }
      if (password.trim()) {
        payload.password = password;
      }
      await updateSchoolUser(user.id, payload);
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
          <CardTitle id="edit-user-title">Edit user</CardTitle>
          <button
            type="button"
            className="rounded-lg p-1 text-muted hover:bg-gray-100 hover:text-ink"
            aria-label="Close"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-1 text-sm text-muted">
          Update profile details for {user.firstName} {user.lastName}.
        </p>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <input
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <input
            type="email"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <FieldSelect
            label="Role"
            value={role}
            onChange={(v) => setRole(v as 'TEACHER' | 'STUDENT' | 'PARENT')}
            options={['STUDENT', 'TEACHER', 'PARENT']}
          />
          {isStudent && academics && (
            <>
              <FieldSelect
                label="Grade / standard"
                value={grade}
                onChange={setGrade}
                options={academics.grades}
                placeholder="Select grade"
                required
              />
              <FieldSelect
                label="Section"
                value={section}
                onChange={setSection}
                options={academics.sections}
                placeholder="Select section"
                required
              />
            </>
          )}
          <PasswordInput
            wrapperClassName="sm:col-span-2"
            placeholder="New password (optional, min 8 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={isSaving || (isStudent && !academics)}>
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
