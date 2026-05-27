import { useCallback } from 'react';
import { X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { mergeAcademicOptions } from '@/utils/academicOptions';
import { formatUserRole } from '@/utils/userRole';
import type { AnalyticsFilterOptions, AnalyticsQueryFilters } from '@/api/dashboard.api';

const ALL = 'All';

interface AnalyticsFilterBarProps {
  options: AnalyticsFilterOptions;
  filters: AnalyticsQueryFilters;
  onChange: (filters: AnalyticsQueryFilters) => void;
}

function withAll(values: string[]): string[] {
  return ['All', ...values];
}

export function AnalyticsFilterBar({ options, filters, onChange }: AnalyticsFilterBarProps) {
  const { grades: schoolGrades, subjects: schoolSubjects } = useSchoolAcademics();
  const mergedOptions: AnalyticsFilterOptions = {
    ...options,
    grades: mergeAcademicOptions(schoolGrades, options.grades),
    subjects: mergeAcademicOptions(schoolSubjects, options.subjects),
  };
  const setField = useCallback(
    (key: keyof AnalyticsQueryFilters, raw: string) => {
      const value = raw === 'All' ? undefined : raw;
      onChange({ ...filters, [key]: value || undefined });
    },
    [filters, onChange],
  );

  const creatorOptions = (mergedOptions.creators ?? []).map(
    (c) => `${c.displayName} (${formatUserRole(c.role)})`,
  );
  const creatorLabelByUserId = new Map(
    (mergedOptions.creators ?? []).map((c) => [
      c.userId,
      `${c.displayName} (${formatUserRole(c.role)})`,
    ]),
  );
  const selectedCreatorLabel = filters.createdByUserId
    ? creatorLabelByUserId.get(filters.createdByUserId) ?? ALL
    : ALL;

  const hasActive =
    !!filters.grade ||
    !!filters.subject ||
    !!filters.board ||
    !!filters.topic ||
    !!filters.createdByUserId;

  return (
    <Card className="!p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Slice &amp; dice</p>
          <p className="text-xs text-muted">Narrow charts and tables by grade, subject, or board</p>
        </div>
        {hasActive && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({})}>
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {creatorOptions.length > 0 && (
          <FieldSelect
            label="Created by"
            value={selectedCreatorLabel}
            onChange={(label) => {
              if (label === ALL) {
                onChange({ ...filters, createdByUserId: undefined });
                return;
              }
              const match = (mergedOptions.creators ?? []).find(
                (c) => `${c.displayName} (${formatUserRole(c.role)})` === label,
              );
              onChange({
                ...filters,
                createdByUserId: match?.userId,
              });
            }}
            options={withAll(creatorOptions)}
          />
        )}
        <FieldSelect
          label="Grade"
          value={filters.grade ?? ALL}
          onChange={(v) => setField('grade', v)}
          options={withAll(mergedOptions.grades)}
        />
        <FieldSelect
          label="Subject"
          value={filters.subject ?? ALL}
          onChange={(v) => setField('subject', v)}
          options={withAll(mergedOptions.subjects)}
        />
        <FieldSelect
          label="Board"
          value={filters.board ?? ALL}
          onChange={(v) => setField('board', v)}
          options={withAll(mergedOptions.boards)}
        />
        <FieldSelect
          label="Topic"
          value={filters.topic ?? ALL}
          onChange={(v) => setField('topic', v)}
          options={withAll(mergedOptions.topics)}
        />
      </div>
    </Card>
  );
}
