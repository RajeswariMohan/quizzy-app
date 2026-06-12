import { useEffect, useMemo, useState } from 'react';
import type { SchoolAcademicConfig } from '@/api/schoolAdmin.api';
import { AcademicGroupFields } from '@/components/academics/AcademicGroupFields';
import { useSchoolAcademics } from '@/hooks/useSchoolAcademics';
import {
  inferGradeKind,
  resolveSeniorEnrollmentValue,
  sectionsForGrade,
} from '@/utils/gradeStructure';

interface GradeSectionFieldsProps {
  grade: string;
  section: string;
  onGradeChange: (grade: string) => void;
  onSectionChange: (section: string) => void;
  academics?: SchoolAcademicConfig | null;
  gradeLabel?: string;
  gradeRequired?: boolean;
  sectionRequired?: boolean;
  disabled?: boolean;
}

/** Grade + section/department selects; options always match the selected grade. */
export function GradeSectionFields({
  grade,
  section,
  onGradeChange,
  onSectionChange,
  academics,
  gradeLabel,
  gradeRequired = true,
  sectionRequired = true,
  disabled = false,
}: GradeSectionFieldsProps) {
  const store = useSchoolAcademics();
  const grades = academics?.grades?.length ? academics.grades : store.grades;
  const gradeSections = academics?.gradeSections ?? store.gradeSections;
  const isLoading = academics ? false : store.isLoading;

  const flat = sectionsForGrade(gradeSections, grade);
  const isSenior = grade ? inferGradeKind(grade) === 'senior_secondary' : false;

  const parsed = useMemo(() => {
    if (!isSenior || !section) {
      return { department: '', sectionLetter: '' };
    }
    if (section.includes(' · ')) {
      const [department, sectionLetter] = section.split(' · ').map((p) => p.trim());
      return { department: department ?? '', sectionLetter: sectionLetter ?? '' };
    }
    return { department: section, sectionLetter: '' };
  }, [isSenior, section]);

  const [seniorDepartment, setSeniorDepartment] = useState(parsed.department);
  const [seniorSectionLetter, setSeniorSectionLetter] = useState(parsed.sectionLetter);

  useEffect(() => {
    setSeniorDepartment(parsed.department);
    setSeniorSectionLetter(parsed.sectionLetter);
  }, [parsed.department, parsed.sectionLetter, grade]);

  const syncSectionFromSenior = (department: string, sectionLetter: string) => {
    const resolved = resolveSeniorEnrollmentValue(flat, department, sectionLetter);
    onSectionChange(resolved);
  };

  const handleGradeChange = (nextGrade: string) => {
    onGradeChange(nextGrade);
    onSectionChange('');
    setSeniorDepartment('');
    setSeniorSectionLetter('');
  };

  const handleSeniorDepartmentChange = (department: string) => {
    setSeniorDepartment(department);
    setSeniorSectionLetter('');
    syncSectionFromSenior(department, '');
  };

  const handleSeniorSectionLetterChange = (sectionLetter: string) => {
    setSeniorSectionLetter(sectionLetter);
    syncSectionFromSenior(seniorDepartment, sectionLetter);
  };

  return (
    <AcademicGroupFields
      grade={grade}
      gradeOptions={grades}
      gradeSections={gradeSections}
      section={isSenior ? '' : section}
      seniorDepartment={seniorDepartment}
      seniorSectionLetter={seniorSectionLetter}
      onGradeChange={handleGradeChange}
      onSectionChange={onSectionChange}
      onSeniorDepartmentChange={handleSeniorDepartmentChange}
      onSeniorSectionLetterChange={handleSeniorSectionLetterChange}
      gradeLabel={gradeLabel}
      gradeRequired={gradeRequired && sectionRequired}
      disabled={disabled || isLoading}
      showGrade
    />
  );
}
