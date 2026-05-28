import { useMemo } from 'react';
import { X } from 'lucide-react';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import {
  ANALYTICS_FILTER_ALL,
  applyAnalyticsFilterField,
  buildCreatorLabelByUserId,
  buildCreatorOptionLabels,
  getLinkedFilterValues,
  mergeAnalyticsFilterOptions,
  resolveCreatorUserId,
  withAllOption,
} from '@/utils/analyticsFilterLinks';
import type { AnalyticsFilterOptions, AnalyticsQueryFilters } from '@/api/dashboard.api';

interface AnalyticsFilterBarProps {
  options: AnalyticsFilterOptions;
  filters: AnalyticsQueryFilters;
  onChange: (filters: AnalyticsQueryFilters) => void;
}

export function AnalyticsFilterBar({ options, filters, onChange }: AnalyticsFilterBarProps) {
  const { grades: schoolGrades, subjects: schoolSubjects } = useSchoolAcademics();
  const mergedOptions = useMemo(
    () => mergeAnalyticsFilterOptions(options, schoolGrades, schoolSubjects),
    [options, schoolGrades, schoolSubjects],
  );
  const links = mergedOptions.links ?? [];

  const linkedValues = useMemo(
    () =>
      getLinkedFilterValues(links, filters, {
        grades: mergedOptions.grades,
        subjects: mergedOptions.subjects,
        topics: mergedOptions.topics,
      }),
    [links, filters, mergedOptions.grades, mergedOptions.subjects, mergedOptions.topics],
  );

  const setField = (key: keyof AnalyticsQueryFilters, raw: string) => {
    onChange(
      applyAnalyticsFilterField(
        filters,
        key,
        raw,
        linkedValues.topics,
        mergedOptions.topics,
        links.length,
      ),
    );
  };

  const creatorOptions = buildCreatorOptionLabels(mergedOptions.creators);
  const creatorLabelByUserId = buildCreatorLabelByUserId(mergedOptions.creators);
  const selectedCreatorLabel = filters.createdByUserId
    ? creatorLabelByUserId.get(filters.createdByUserId) ?? ANALYTICS_FILTER_ALL
    : ANALYTICS_FILTER_ALL;

  const hasActive =
    !!filters.grade ||
    !!filters.subject ||
    !!filters.board ||
    !!filters.topic ||
    !!filters.createdByUserId;

  return (
    <FilterPanel>
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
              const userId = resolveCreatorUserId(label, mergedOptions.creators);
              onChange({ ...filters, createdByUserId: userId });
            }}
            options={withAllOption(creatorOptions)}
          />
        )}
        <FieldSelect
          label="Grade"
          value={filters.grade ?? ANALYTICS_FILTER_ALL}
          onChange={(v) => setField('grade', v)}
          options={withAllOption(linkedValues.grades)}
        />
        <FieldSelect
          label="Subject"
          value={filters.subject ?? ANALYTICS_FILTER_ALL}
          onChange={(v) => setField('subject', v)}
          options={withAllOption(linkedValues.subjects)}
        />
        <FieldSelect
          label="Board"
          value={filters.board ?? ANALYTICS_FILTER_ALL}
          onChange={(v) => setField('board', v)}
          options={withAllOption(mergedOptions.boards)}
        />
        <FieldSelect
          label="Topic"
          value={filters.topic ?? ANALYTICS_FILTER_ALL}
          onChange={(v) => setField('topic', v)}
          options={withAllOption(linkedValues.topics)}
        />
      </div>
    </FilterPanel>
  );
}
