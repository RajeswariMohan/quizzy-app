import { useMemo } from 'react';
import { X } from 'lucide-react';
import { FilterPanel } from '@/components/layout/FilterPanel';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { TableSearchInput } from '@/components/ui/TableSearchInput';
import { AcademicGroupFilterFields } from '@/components/academics/AcademicGroupFilterFields';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { FILTER_ALL } from '@/utils/gradeStructure';
import { mergeGradeOptions, mergeSubjectOptions } from '@/utils/academicOptions';
import {
  applyQuizListGradeChange,
  applyQuizListSubjectChange,
  buildDefaultQuizListFilters,
  getQuizListSubjectFilterOptions,
  getQuizListTopicFilterOptions,
  hasActiveQuizFilters,
  QUIZ_STATUS_FILTER_OPTIONS,
  quizStatusFilterLabel,
  type QuizAcademicLink,
  type QuizFilterOptions,
  type QuizListFilters,
} from '@/utils/quizFilters';

const ALL = 'All';

const COMPACT_DATE_CLASS =
  'w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-primary';

function withAll(values: string[]): string[] {
  return values.length > 0 ? [ALL, ...values] : [ALL];
}

function ensureOptionInList(pool: string[], value: string): string[] {
  if (value === FILTER_ALL || pool.includes(value)) return pool;
  return [value, ...pool];
}

interface QuizListFilterBarProps {
  filters: QuizListFilters;
  options: QuizFilterOptions;
  academicLinks?: QuizAcademicLink[];
  resultCount: number;
  totalCount: number;
  onChange: (filters: QuizListFilters) => void;
}

export function QuizListFilterBar({
  filters,
  options,
  academicLinks = [],
  resultCount,
  totalCount,
  onChange,
}: QuizListFilterBarProps) {
  const { grades: schoolGrades, gradeSections, subjects: schoolSubjects } = useSchoolAcademics();
  const gradeOptions = mergeGradeOptions(schoolGrades, options.grades);
  const subjectOptions = mergeSubjectOptions(schoolSubjects, options.subjects);

  const useLinkedFilters = academicLinks.length > 0;

  const displaySubjectOptions = useMemo(() => {
    const pool = getQuizListSubjectFilterOptions(
      academicLinks,
      filters.grade,
      filters.subject,
      subjectOptions,
    );
    return ensureOptionInList(pool, filters.subject);
  }, [academicLinks, filters.grade, filters.subject, subjectOptions]);

  const displayTopicOptions = useMemo(() => {
    const pool = getQuizListTopicFilterOptions(
      academicLinks,
      filters.grade,
      filters.subject,
      options.topics,
    );
    return ensureOptionInList(pool, filters.topic);
  }, [academicLinks, filters.grade, filters.subject, options.topics]);

  const topicFilterReady =
    !useLinkedFilters ||
    (filters.grade !== FILTER_ALL && filters.subject !== FILTER_ALL);

  const set = <K extends keyof QuizListFilters>(key: K, value: QuizListFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const statusLabels = QUIZ_STATUS_FILTER_OPTIONS.map(quizStatusFilterLabel);
  const filtersActive = hasActiveQuizFilters(filters);

  const sortLabel =
    filters.sort === 'newest'
      ? 'Newest first'
      : filters.sort === 'oldest'
        ? 'Oldest first'
        : 'Title (A–Z)';

  return (
    <FilterPanel className="p-3">
      <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
        <TableSearchInput
          compact
          id="quiz-list-search"
          label="Search"
          placeholder="Title, subject, topic…"
          value={filters.search}
          onChange={(v) => set('search', v)}
          className="min-w-[200px] flex-[3] sm:min-w-[240px]"
        />
        <FieldSelect
          compact
          className="w-[118px]"
          label="Status"
          value={quizStatusFilterLabel(filters.status)}
          onChange={(label) => {
            const idx = statusLabels.indexOf(label);
            const status = QUIZ_STATUS_FILTER_OPTIONS[idx] ?? 'All';
            set('status', status);
          }}
          options={statusLabels}
        />
        <FieldSelect
          compact
          className="w-[128px]"
          label="Sort"
          value={sortLabel}
          onChange={(v) => {
            const sort =
              v === 'Oldest first' ? 'oldest' : v === 'Title (A–Z)' ? 'title' : 'newest';
            set('sort', sort);
          }}
          options={['Newest first', 'Oldest first', 'Title (A–Z)']}
        />
        <div className="flex shrink-0 items-center gap-2 pb-0.5 sm:ml-auto">
          <span className="whitespace-nowrap text-xs text-muted">
            {resultCount} of {totalCount}
            {filtersActive ? ' · filtered' : ''}
          </span>
          {filtersActive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => onChange(buildDefaultQuizListFilters())}
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-2">
        <div className="w-[132px]">
          <label className="mb-0.5 block text-xs font-medium text-muted">From</label>
          <input
            type="date"
            className={COMPACT_DATE_CLASS}
            value={filters.dateFrom}
            max={filters.dateTo}
            onChange={(e) => set('dateFrom', e.target.value)}
          />
        </div>
        <div className="w-[132px]">
          <label className="mb-0.5 block text-xs font-medium text-muted">To</label>
          <input
            type="date"
            className={COMPACT_DATE_CLASS}
            value={filters.dateTo}
            min={filters.dateFrom}
            onChange={(e) => set('dateTo', e.target.value)}
          />
        </div>
        <FieldSelect
          compact
          className="w-[120px] sm:w-[128px]"
          label="Grade"
          value={filters.grade}
          onChange={(v) =>
            onChange(
              applyQuizListGradeChange(
                filters,
                v,
                academicLinks,
                options.topics,
                subjectOptions,
              ),
            )
          }
          options={withAll(gradeOptions)}
        />
        <FieldSelect
          compact
          className="w-[128px] sm:w-[140px]"
          label="Subject"
          value={filters.subject}
          onChange={(v) =>
            onChange(applyQuizListSubjectChange(filters, v, academicLinks, options.topics))
          }
          options={withAll(displaySubjectOptions)}
        />
        <FieldSelect
          compact
          className="w-[128px] sm:w-[140px]"
          label="Topic"
          value={filters.topic}
          onChange={(v) => set('topic', v)}
          options={withAll(displayTopicOptions)}
          disabled={!topicFilterReady}
          placeholder={
            useLinkedFilters && !topicFilterReady ? 'Select grade & subject' : undefined
          }
        />
      </div>

      {filters.grade !== FILTER_ALL && (
        <div className="mt-2 max-w-xl">
          <AcademicGroupFilterFields
            grade={filters.grade}
            gradeSections={gradeSections}
            values={filters.academicGroup}
            onChange={(academicGroup) => onChange({ ...filters, academicGroup })}
            className="[&_label]:mb-0.5 [&_label]:text-xs [&_label]:font-medium [&_label]:text-muted [&_select]:rounded-lg [&_select]:px-2.5 [&_select]:py-1.5"
          />
        </div>
      )}
    </FilterPanel>
  );
}
