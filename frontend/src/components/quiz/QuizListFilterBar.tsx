import { Search, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { BOARDS } from '@/constants/academics';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import { mergeAcademicOptions } from '@/utils/academicOptions';
import {
  DEFAULT_QUIZ_LIST_FILTERS,
  hasActiveQuizFilters,
  type QuizFilterOptions,
  type QuizListFilters,
} from '@/utils/quizFilters';

const ALL = 'All';

function withAll(values: string[]): string[] {
  return values.length > 0 ? [ALL, ...values] : [ALL];
}

interface QuizListFilterBarProps {
  filters: QuizListFilters;
  options: QuizFilterOptions;
  resultCount: number;
  totalCount: number;
  onChange: (filters: QuizListFilters) => void;
}

export function QuizListFilterBar({
  filters,
  options,
  resultCount,
  totalCount,
  onChange,
}: QuizListFilterBarProps) {
  const { grades: schoolGrades, subjects: schoolSubjects } = useSchoolAcademics();
  const gradeOptions = mergeAcademicOptions(schoolGrades, options.grades);
  const subjectOptions = mergeAcademicOptions(schoolSubjects, options.subjects);
  const boardOptions = mergeAcademicOptions([...BOARDS], options.boards);

  const set = <K extends keyof QuizListFilters>(key: K, value: QuizListFilters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <Card className="!p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">Find quizzes</p>
          <p className="text-xs text-muted">
            Showing {resultCount} of {totalCount}
            {hasActiveQuizFilters(filters) ? ' · filters active' : ''}
          </p>
        </div>
        {hasActiveQuizFilters(filters) && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ ...DEFAULT_QUIZ_LIST_FILTERS })}
          >
            <X className="h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-sm font-medium text-ink">Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            placeholder="Title, subject, topic, board, grade…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            value={filters.search}
            onChange={(e) => set('search', e.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <FieldSelect
          label="Grade"
          value={filters.grade}
          onChange={(v) => set('grade', v)}
          options={withAll(gradeOptions)}
        />
        <FieldSelect
          label="Subject"
          value={filters.subject}
          onChange={(v) => set('subject', v)}
          options={withAll(subjectOptions)}
        />
        <FieldSelect
          label="Board"
          value={filters.board}
          onChange={(v) => set('board', v)}
          options={withAll(boardOptions)}
        />
        <FieldSelect
          label="Topic"
          value={filters.topic}
          onChange={(v) => set('topic', v)}
          options={withAll(options.topics)}
        />
        <FieldSelect
          label="Sort by"
          value={
            filters.sort === 'newest'
              ? 'Newest first'
              : filters.sort === 'oldest'
                ? 'Oldest first'
                : 'Title (A–Z)'
          }
          onChange={(v) => {
            const sort =
              v === 'Oldest first' ? 'oldest' : v === 'Title (A–Z)' ? 'title' : 'newest';
            set('sort', sort);
          }}
          options={['Newest first', 'Oldest first', 'Title (A–Z)']}
        />
      </div>
    </Card>
  );
}
