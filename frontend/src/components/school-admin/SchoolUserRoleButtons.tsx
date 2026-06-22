import type { OnboardRole } from '@/utils/schoolUserOnboarding';

interface SchoolUserRoleButtonsProps {
  value: OnboardRole;
  onChange: (role: OnboardRole) => void;
  /** When false, Parent is omitted (matches signup when parent portal is disabled). */
  parentPortalEnabled?: boolean;
  /** Restrict which roles appear (defaults to student/parent/teacher). */
  allowedRoles?: OnboardRole[];
  disabled?: boolean;
  label?: string;
}

export function SchoolUserRoleButtons({
  value,
  onChange,
  parentPortalEnabled = true,
  allowedRoles,
  disabled = false,
  label = 'I am a',
}: SchoolUserRoleButtonsProps) {
  const defaultRoles: OnboardRole[] = parentPortalEnabled
    ? ['STUDENT', 'PARENT', 'TEACHER']
    : ['STUDENT', 'TEACHER'];
  const roles = allowedRoles ?? defaultRoles;

  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <div
        className={`grid gap-2 ${roles.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
        role="group"
        aria-label="Account role"
      >
        {roles.map((r) => (
          <button
            key={r}
            type="button"
            disabled={disabled}
            onClick={() => onChange(r)}
            aria-pressed={value === r}
            className={`rounded-xl border px-2 py-2 text-xs font-medium capitalize transition disabled:opacity-50 ${
              value === r
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-gray-200 text-muted hover:border-gray-300'
            }`}
          >
            {r.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
