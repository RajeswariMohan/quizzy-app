import type { EngagementQuery } from '@/api/engagement.api';
import { toIsoDate } from '@/lib/dateRange';
import { useAuthStore } from '@/store/authStore';
import type { UserRole } from '@/types/auth';

export interface EngagementFilterFieldsProps {
  filters: EngagementQuery;
  defaultRange: { dateFrom: string; dateTo: string };
  onChange: (filters: EngagementQuery) => void;
  idPrefix?: string;
}

export function EngagementFilterFields({
  filters,
  defaultRange,
  onChange,
  idPrefix = 'engagement',
}: EngagementFilterFieldsProps) {
  const viewerRole = useAuthStore((s) => s.user?.role);
  const isTeacher = viewerRole === 'TEACHER';

  const setDateField = (key: 'dateFrom' | 'dateTo', value: string) => {
    onChange({ ...filters, [key]: value, days: undefined });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label
          htmlFor={`${idPrefix}-date-from`}
          className="mb-1 block text-sm font-medium text-ink"
        >
          From
        </label>
        <input
          id={`${idPrefix}-date-from`}
          type="date"
          className="w-full min-w-[10.5rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          value={filters.dateFrom ?? defaultRange.dateFrom}
          max={filters.dateTo ?? defaultRange.dateTo}
          onChange={(e) => setDateField('dateFrom', e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor={`${idPrefix}-date-to`}
          className="mb-1 block text-sm font-medium text-ink"
        >
          To
        </label>
        <input
          id={`${idPrefix}-date-to`}
          type="date"
          className="w-full min-w-[10.5rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
          value={filters.dateTo ?? defaultRange.dateTo}
          min={filters.dateFrom ?? defaultRange.dateFrom}
          max={toIsoDate(new Date())}
          onChange={(e) => setDateField('dateTo', e.target.value)}
        />
      </div>
      {!isTeacher && (
        <div>
          <label
            htmlFor={`${idPrefix}-role`}
            className="mb-1 block text-sm font-medium text-ink"
          >
            Role
          </label>
          <select
            id={`${idPrefix}-role`}
            className="min-w-[9rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
            value={filters.role ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                role: (e.target.value || undefined) as UserRole | undefined,
                days: undefined,
              })
            }
          >
            <option value="">All roles</option>
            <option value="STUDENT">Students</option>
            <option value="TEACHER">Teachers</option>
            <option value="SCHOOL_ADMIN">School admins</option>
          </select>
        </div>
      )}
    </div>
  );
}
