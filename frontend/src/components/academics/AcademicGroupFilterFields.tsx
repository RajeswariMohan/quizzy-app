import { useMemo } from 'react';
import { FieldSelect } from '@/components/ui/FieldSelect';
import {
  FILTER_ALL,
  academicGroupFilterModel,
  childGroupLabel,
  departmentLabel,
  type AcademicGroupFilterValues,
} from '@/utils/gradeStructure';

export type { AcademicGroupFilterValues };
export { DEFAULT_ACADEMIC_GROUP_FILTER } from '@/utils/gradeStructure';

interface AcademicGroupFilterFieldsProps {
  grade: string;
  gradeSections: Record<string, string[]>;
  values: AcademicGroupFilterValues;
  onChange: (values: AcademicGroupFilterValues) => void;
  disabled?: boolean;
  className?: string;
}

function withAll(options: string[]): string[] {
  return options.length > 0 ? [FILTER_ALL, ...options] : [FILTER_ALL];
}

/** Grade-dependent department/section filters (Class 11/12) or section-only for other grades. */
export function AcademicGroupFilterFields({
  grade,
  gradeSections,
  values,
  onChange,
  disabled = false,
  className,
}: AcademicGroupFilterFieldsProps) {
  const model = useMemo(
    () => academicGroupFilterModel(grade, gradeSections),
    [grade, gradeSections],
  );

  const patch = (partial: Partial<AcademicGroupFilterValues>) => {
    onChange({ ...values, ...partial });
  };

  if (model.mode === 'none') {
    return null;
  }

  if (model.mode === 'department_only' || model.mode === 'department_and_section') {
    return (
      <div className={className}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldSelect
            label={departmentLabel()}
            value={values.department}
            onChange={(department) =>
              patch({
                department,
                sectionLetter: FILTER_ALL,
              })
            }
            options={withAll(model.departments)}
            disabled={disabled}
          />
          {model.mode === 'department_and_section' && (
            <FieldSelect
              label={childGroupLabel()}
              value={values.sectionLetter}
              onChange={(sectionLetter) => patch({ sectionLetter })}
              options={withAll(model.sectionLetters)}
              disabled={disabled || values.department === FILTER_ALL}
              placeholder={
                values.department === FILTER_ALL
                  ? `Select ${departmentLabel().toLowerCase()} first`
                  : `All ${childGroupLabel().toLowerCase()}s`
              }
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <FieldSelect
        label={childGroupLabel()}
        value={values.group}
        onChange={(group) => patch({ group })}
        options={withAll(model.flatOptions)}
        disabled={disabled}
        placeholder={`All ${childGroupLabel().toLowerCase()}s`}
      />
    </div>
  );
}
