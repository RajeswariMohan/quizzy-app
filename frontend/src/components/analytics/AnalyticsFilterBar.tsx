import { useMemo } from 'react';
import { X } from 'lucide-react';
import { AcademicGroupFilterFields } from '@/components/academics/AcademicGroupFilterFields';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import type { AnalyticsFilterOptions, AnalyticsQueryFilters } from '@/api/dashboard.api';
import {
  ANALYTICS_FILTER_ALL,
  applyAnalyticsFilterField,
  getLinkedFilterValues,
  mergeAnalyticsFilterOptions,
  withAllOption,
} from '@/utils/analyticsFilterLinks';
import {
  DEFAULT_ACADEMIC_GROUP_FILTER,
  FILTER_ALL,
  parseStoredSectionForFilters,
  resolveFilterSectionValue,
  type AcademicGroupFilterValues,
} from '@/utils/gradeStructure';

interface AnalyticsFilterBarProps {
  options: AnalyticsFilterOptions;
  filters: AnalyticsQueryFilters;
  onChange: (filters: AnalyticsQueryFilters) => void;
}

export function AnalyticsFilterBar({ options, filters, onChange }: AnalyticsFilterBarProps) {
  const { grades: schoolGrades, gradeSections, subjects: schoolSubjects } = useSchoolAcademics();
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

  const filterGrade = filters.grade ?? ANALYTICS_FILTER_ALL;

  const academicGroup = useMemo((): AcademicGroupFilterValues => {
    if (!filters.grade) return { ...DEFAULT_ACADEMIC_GROUP_FILTER };
    return parseStoredSectionForFilters(filters.grade, gradeSections, filters.section);
  }, [filters.grade, filters.section, gradeSections]);

  const setField = (key: keyof AnalyticsQueryFilters, raw: string) => {
    const next = applyAnalyticsFilterField(
      filters,
      key,
      raw,
      linkedValues.topics,
      mergedOptions.topics,
      links.length,
    );
    if (key === 'grade') {
      delete next.section;
    }
    onChange(next);
  };

  const setAcademicGroup = (values: AcademicGroupFilterValues) => {
    if (!filters.grade) {
      onChange({ ...filters, section: undefined });
      return;
    }
    const section = resolveFilterSectionValue({
      grade: filters.grade,
      gradeSections,
      department: values.department,
      sectionLetter: values.sectionLetter,
      group: values.group,
    });
    onChange({ ...filters, section });
  };

  const hasActive =
    !!filters.grade ||
    !!filters.section ||
    !!filters.subject ||
    !!filters.topic;

  return (
    <FilterPanel>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Slice &amp; dice</p>
          <p className="text-xs text-muted">
            Narrow charts and tables by grade, department/section, subject, or topic
          </p>
        </div>
        {hasActive && (
          <Button type="button" variant="outline" size="sm" onClick={() => onChange({})}>
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <FieldSelect
          label="Grade"
          value={filterGrade}
          onChange={(v) => setField('grade', v)}
          options={withAllOption(linkedValues.grades)}
        />
        {filterGrade !== ANALYTICS_FILTER_ALL && filterGrade !== FILTER_ALL && (
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4">
            <AcademicGroupFilterFields
              grade={filterGrade}
              gradeSections={gradeSections}
              values={academicGroup}
              onChange={setAcademicGroup}
            />
          </div>
        )}
        <FieldSelect
          label="Subject"
          value={filters.subject ?? ANALYTICS_FILTER_ALL}
          onChange={(v) => setField('subject', v)}
          options={withAllOption(linkedValues.subjects)}
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
