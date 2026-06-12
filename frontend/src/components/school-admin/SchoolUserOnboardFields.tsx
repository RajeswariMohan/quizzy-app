import { useEffect, useState } from 'react';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { GradeSectionFields } from '@/components/school-admin/GradeSectionFields';
import { SchoolUserRoleButtons } from '@/components/school-admin/SchoolUserRoleButtons';
import type { SchoolAcademicConfig } from '@/api/schoolAdmin.api';
import { checkUsernameAvailability } from '@/api/auth.api';
import { logApiError } from '@/api/client';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { validateUsername } from '@/utils/username';
import {
  ONBOARD_FORM_INPUT_CLASS,
  PARENT_EMAIL_HINT,
  PARENT_SIGNUP_HINT,
  USERNAME_HINT,
  type OnboardRole,
} from '@/utils/schoolUserOnboarding';

export interface SchoolUserOnboardValues {
  firstName: string;
  lastName: string;
  role: OnboardRole;
  username: string;
  email: string;
  parentEmail: string;
  password: string;
  grade: string;
  section: string;
}

interface SchoolUserOnboardFieldsProps {
  values: SchoolUserOnboardValues;
  onChange: <K extends keyof SchoolUserOnboardValues>(
    field: K,
    value: SchoolUserOnboardValues[K],
  ) => void;
  academics: SchoolAcademicConfig | null;
  schoolId: string | null;
  parentPortalEnabled?: boolean;
  disabled?: boolean;
  /** When true, shows enrollment fields for students (admin single-step form). */
  showStudentEnrollment?: boolean;
  /** Notifies parent when username availability blocks submit (students only). */
  onSubmitBlockedChange?: (blocked: boolean) => void;
}

export function SchoolUserOnboardFields({
  values,
  onChange,
  academics,
  schoolId,
  parentPortalEnabled = true,
  disabled = false,
  showStudentEnrollment = true,
  onSubmitBlockedChange,
}: SchoolUserOnboardFieldsProps) {
  const { role, firstName, lastName, username, email, parentEmail, password, grade, section } =
    values;

  const debouncedUsername = useDebouncedValue(username, 400);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  const isStudent = role === 'STUDENT';

  useEffect(() => {
    if (!isStudent || !schoolId) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const formatError = validateUsername(debouncedUsername);
    if (!debouncedUsername.trim()) {
      setUsernameAvailable(null);
      setUsernameError(null);
      return;
    }
    if (formatError) {
      setUsernameAvailable(false);
      setUsernameError(formatError);
      return;
    }

    let cancelled = false;
    setUsernameChecking(true);
    checkUsernameAvailability(schoolId, debouncedUsername)
      .then((res) => {
        if (cancelled) return;
        setUsernameAvailable(res.available);
        setUsernameError(res.available ? null : (res.reason ?? 'This username is already taken'));
      })
      .catch((err) => {
        if (cancelled) return;
        logApiError('Username availability check failed', err);
        setUsernameAvailable(null);
        setUsernameError(null);
      })
      .finally(() => {
        if (!cancelled) setUsernameChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedUsername, schoolId, isStudent]);

  const usernameInvalid =
    isStudent &&
    (usernameChecking || usernameAvailable === false || !!validateUsername(username));

  useEffect(() => {
    onSubmitBlockedChange?.(usernameInvalid);
  }, [usernameInvalid, onSubmitBlockedChange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">First name</label>
          <input
            required
            autoComplete="given-name"
            className={ONBOARD_FORM_INPUT_CLASS}
            value={firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            disabled={disabled}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Last name</label>
          <input
            required
            autoComplete="family-name"
            className={ONBOARD_FORM_INPUT_CLASS}
            value={lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      <SchoolUserRoleButtons
        value={role}
        onChange={(nextRole) => onChange('role', nextRole)}
        parentPortalEnabled={parentPortalEnabled}
        disabled={disabled}
      />

      <div>
        {isStudent ? (
          <>
            <label className="mb-1 block text-sm font-medium text-ink">Username</label>
            <input
              type="text"
              required
              autoComplete="username"
              spellCheck={false}
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9._-]+"
              placeholder="e.g. alex.2024"
              className={ONBOARD_FORM_INPUT_CLASS}
              value={username}
              onChange={(e) => {
                onChange('username', e.target.value);
                setUsernameAvailable(null);
                setUsernameError(null);
              }}
              disabled={disabled}
            />
            <p className="mt-1 text-xs text-muted">{USERNAME_HINT}</p>
            {usernameChecking && (
              <p className="mt-1 text-xs text-muted">Checking availability…</p>
            )}
            {!usernameChecking && usernameAvailable === true && (
              <p className="mt-1 text-xs text-success">Username is available</p>
            )}
            {usernameError && (
              <p className="mt-1 text-xs text-danger" role="alert">
                {usernameError}
              </p>
            )}
          </>
        ) : (
          <>
            <label className="mb-1 block text-sm font-medium text-ink">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              className={ONBOARD_FORM_INPUT_CLASS}
              value={email}
              onChange={(e) => onChange('email', e.target.value)}
              disabled={disabled}
            />
          </>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Password</label>
        <PasswordInput
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => onChange('password', e.target.value)}
          disabled={disabled}
        />
      </div>

      {isStudent && (
        <div>
          <label className="mb-1 block text-sm font-medium text-ink">Parent email</label>
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="parent@example.com"
            className={ONBOARD_FORM_INPUT_CLASS}
            value={parentEmail}
            onChange={(e) => onChange('parentEmail', e.target.value)}
            disabled={disabled}
          />
          <p className="mt-1 text-xs text-muted">{PARENT_EMAIL_HINT}</p>
        </div>
      )}

      {role === 'PARENT' && (
        <p className="text-sm text-muted">{PARENT_SIGNUP_HINT}</p>
      )}

      {isStudent && showStudentEnrollment && academics && (
        <GradeSectionFields
          academics={academics}
          grade={grade}
          section={section}
          onGradeChange={(v) => onChange('grade', v)}
          onSectionChange={(v) => onChange('section', v)}
          disabled={disabled}
        />
      )}
    </div>
  );
}

export function isSchoolUserOnboardValid(
  values: SchoolUserOnboardValues,
  options?: { academicsRequired?: boolean; usernameAvailable?: boolean | null },
): boolean {
  const { role, firstName, lastName, password, username, email, parentEmail, grade, section } =
    values;

  if (!firstName.trim() || !lastName.trim() || password.length < 8) return false;

  if (role === 'STUDENT') {
    if (validateUsername(username)) return false;
    if (options?.usernameAvailable === false) return false;
    if (!parentEmail.trim() || !parentEmail.includes('@')) return false;
    if (options?.academicsRequired && (!grade || !section)) return false;
    return true;
  }

  return Boolean(email.trim() && email.includes('@'));
}
