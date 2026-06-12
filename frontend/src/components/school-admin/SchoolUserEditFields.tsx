import { PasswordInput } from '@/components/ui/PasswordInput';
import { GradeSectionFields } from '@/components/school-admin/GradeSectionFields';
import type { SchoolAcademicConfig, UpdateSchoolUserPayload } from '@/api/schoolAdmin.api';
import {
  ONBOARD_FORM_INPUT_CLASS,
  PARENT_EMAIL_HINT,
  PARENT_SIGNUP_HINT,
  USERNAME_READ_ONLY_HINT,
  roleLabel,
  type OnboardRole,
} from '@/utils/schoolUserOnboarding';

/** Editable profile fields — role is fixed and passed separately. */
export interface SchoolUserEditValues {
  firstName: string;
  lastName: string;
  email: string;
  parentEmail: string;
  password: string;
  grade: string;
  section: string;
}

interface SchoolUserEditFieldsProps {
  role: OnboardRole;
  values: SchoolUserEditValues;
  onChange: <K extends keyof SchoolUserEditValues>(
    field: K,
    value: SchoolUserEditValues[K],
  ) => void;
  /** Required when role is STUDENT. */
  username?: string | null;
  academics?: SchoolAcademicConfig | null;
  disabled?: boolean;
}

function NameFields({
  values,
  onChange,
  disabled,
}: Pick<SchoolUserEditFieldsProps, 'values' | 'onChange' | 'disabled'>) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink">First name</label>
        <input
          required
          autoComplete="given-name"
          className={ONBOARD_FORM_INPUT_CLASS}
          value={values.firstName}
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
          value={values.lastName}
          onChange={(e) => onChange('lastName', e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

function OptionalPasswordField({
  values,
  onChange,
  disabled,
}: Pick<SchoolUserEditFieldsProps, 'values' | 'onChange' | 'disabled'>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">New password</label>
      <PasswordInput
        minLength={8}
        autoComplete="new-password"
        placeholder="Leave blank to keep current password"
        value={values.password}
        onChange={(e) => onChange('password', e.target.value)}
        disabled={disabled}
      />
      <p className="mt-1 text-xs text-muted">Optional. Minimum 8 characters when set.</p>
    </div>
  );
}

function StudentEditFields({
  values,
  onChange,
  username,
  academics,
  disabled,
}: SchoolUserEditFieldsProps) {
  return (
    <>
      <NameFields values={values} onChange={onChange} disabled={disabled} />

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Username</label>
        <input
          type="text"
          readOnly
          className={`${ONBOARD_FORM_INPUT_CLASS} bg-gray-50 text-ink`}
          value={username ?? ''}
          aria-readonly
        />
        <p className="mt-1 text-xs text-muted">{USERNAME_READ_ONLY_HINT}</p>
      </div>

      <OptionalPasswordField values={values} onChange={onChange} disabled={disabled} />

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Parent email</label>
        <input
          type="email"
          autoComplete="email"
          placeholder="parent@example.com"
          className={ONBOARD_FORM_INPUT_CLASS}
          value={values.parentEmail}
          onChange={(e) => onChange('parentEmail', e.target.value)}
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-muted">{PARENT_EMAIL_HINT}</p>
      </div>

      {academics && (
        <GradeSectionFields
          academics={academics}
          grade={values.grade}
          section={values.section}
          onGradeChange={(v) => onChange('grade', v)}
          onSectionChange={(v) => onChange('section', v)}
          disabled={disabled}
        />
      )}
    </>
  );
}

function TeacherEditFields({
  values,
  onChange,
  disabled,
}: Pick<SchoolUserEditFieldsProps, 'values' | 'onChange' | 'disabled'>) {
  return (
    <>
      <NameFields values={values} onChange={onChange} disabled={disabled} />

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          className={ONBOARD_FORM_INPUT_CLASS}
          value={values.email}
          onChange={(e) => onChange('email', e.target.value)}
          disabled={disabled}
        />
      </div>

      <OptionalPasswordField values={values} onChange={onChange} disabled={disabled} />
    </>
  );
}

function ParentEditFields({
  values,
  onChange,
  disabled,
}: Pick<SchoolUserEditFieldsProps, 'values' | 'onChange' | 'disabled'>) {
  return (
    <>
      <NameFields values={values} onChange={onChange} disabled={disabled} />

      <div>
        <label className="mb-1 block text-sm font-medium text-ink">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          className={ONBOARD_FORM_INPUT_CLASS}
          value={values.email}
          onChange={(e) => onChange('email', e.target.value)}
          disabled={disabled}
        />
        <p className="mt-1 text-xs text-muted">{PARENT_SIGNUP_HINT}</p>
      </div>

      <OptionalPasswordField values={values} onChange={onChange} disabled={disabled} />
    </>
  );
}

export function SchoolUserEditFields(props: SchoolUserEditFieldsProps) {
  const { role } = props;

  if (role === 'STUDENT') {
    return <StudentEditFields {...props} />;
  }
  if (role === 'TEACHER') {
    return <TeacherEditFields {...props} />;
  }
  return <ParentEditFields {...props} />;
}

export function editDialogTitle(role: OnboardRole): string {
  return `Edit ${roleLabel(role).toLowerCase()}`;
}

export function isSchoolUserEditValid(
  role: OnboardRole,
  values: SchoolUserEditValues,
  options?: { academicsRequired?: boolean },
): boolean {
  if (!values.firstName.trim() || !values.lastName.trim()) return false;
  if (values.password.length > 0 && values.password.length < 8) return false;

  if (role === 'STUDENT') {
    if (values.parentEmail.trim() && !values.parentEmail.includes('@')) return false;
    if (options?.academicsRequired && (!values.grade || !values.section)) return false;
    return true;
  }

  return Boolean(values.email.trim() && values.email.includes('@'));
}

export function buildUpdatePayloadFromEditValues(
  role: OnboardRole,
  values: SchoolUserEditValues,
): UpdateSchoolUserPayload {
  const payload: UpdateSchoolUserPayload = {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
  };

  if (role === 'STUDENT') {
    payload.grade = values.grade;
    payload.section = values.section;
    const trimmedParent = values.parentEmail.trim();
    if (trimmedParent) {
      payload.parentEmail = trimmedParent;
    }
  } else {
    payload.email = values.email.trim();
  }

  if (values.password.trim()) {
    payload.password = values.password;
  }

  return payload;
}
