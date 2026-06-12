import { FieldSelect } from '@/components/ui/FieldSelect';
import {
  childGroupLabel,
  departmentLabel,
  gradeLevelLabel,
  inferGradeKind,
  seniorEnrollmentUiModel,
  seniorStructureHint,
  sectionsForGrade,
} from '@/utils/gradeStructure';

export interface AcademicGroupFieldsProps {
  grade: string;
  gradeOptions: string[];
  gradeSections: Record<string, string[]>;
  section: string;
  seniorDepartment: string;
  seniorSectionLetter: string;
  onGradeChange: (grade: string) => void;
  onSectionChange: (section: string) => void;
  onSeniorDepartmentChange: (department: string) => void;
  onSeniorSectionLetterChange: (sectionLetter: string) => void;
  gradeLabel?: string;
  gradeRequired?: boolean;
  disabled?: boolean;
  showGrade?: boolean;
}

/** Required grade + section/department enrollment fields (school-configured). */
export function AcademicGroupFields({
  grade,
  gradeOptions,
  gradeSections,
  section,
  seniorDepartment,
  seniorSectionLetter,
  onGradeChange,
  onSectionChange,
  onSeniorDepartmentChange,
  onSeniorSectionLetterChange,
  gradeLabel = gradeLevelLabel(),
  gradeRequired = true,
  disabled = false,
  showGrade = true,
}: AcademicGroupFieldsProps) {
  const gradeKind = inferGradeKind(grade);
  const flat = sectionsForGrade(gradeSections, grade);
  const seniorUi =
    gradeKind === 'senior_secondary' ? seniorEnrollmentUiModel(flat) : null;
  const usesSeniorDepartments =
    seniorUi &&
    (seniorUi.mode === 'department_only' || seniorUi.mode === 'department_and_section');

  const handleGradeChange = (nextGrade: string) => {
    onGradeChange(nextGrade);
    onSectionChange('');
    onSeniorDepartmentChange('');
    onSeniorSectionLetterChange('');
  };

  return (
    <>
      {showGrade && (
        <FieldSelect
          label={gradeLabel}
          value={grade}
          options={gradeOptions}
          onChange={handleGradeChange}
          required={gradeRequired}
          disabled={disabled}
        />
      )}

      {usesSeniorDepartments ? (
        <>
          <FieldSelect
            label={departmentLabel()}
            value={seniorDepartment}
            options={seniorUi.departments}
            onChange={onSeniorDepartmentChange}
            required
            disabled={disabled || !grade || seniorUi.departments.length === 0}
            placeholder={
              !grade
                ? 'Select grade first'
                : seniorUi.departments.length === 0
                  ? 'No departments configured for this grade'
                  : `Select ${departmentLabel().toLowerCase()}`
            }
          />
          {seniorUi.mode === 'department_and_section' && (
            <FieldSelect
              label={childGroupLabel()}
              value={seniorSectionLetter}
              options={seniorUi.sectionLetters}
              onChange={onSeniorSectionLetterChange}
              required
              disabled={
                disabled || !seniorDepartment || seniorUi.sectionLetters.length === 0
              }
              placeholder={
                !seniorDepartment
                  ? `Select ${departmentLabel().toLowerCase()} first`
                  : seniorUi.sectionLetters.length === 0
                    ? 'No sections configured'
                    : `Select ${childGroupLabel().toLowerCase()}`
              }
            />
          )}
          <p className="text-xs text-muted">{seniorStructureHint('senior_secondary')}</p>
        </>
      ) : (
        <>
          <FieldSelect
            label={childGroupLabel()}
            value={section}
            options={flat}
            onChange={onSectionChange}
            required
            disabled={disabled || !grade || flat.length === 0}
            placeholder={
              !grade
                ? 'Select grade first'
                : flat.length === 0
                  ? 'No sections configured for this grade'
                  : `Select ${childGroupLabel().toLowerCase()}`
            }
          />
          {grade && (
            <p className="text-xs text-muted">{seniorStructureHint(gradeKind)}</p>
          )}
        </>
      )}
    </>
  );
}
