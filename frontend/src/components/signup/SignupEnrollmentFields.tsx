import { AcademicGroupFields } from '@/components/academics/AcademicGroupFields';

interface SignupEnrollmentFieldsProps {
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
}

export function SignupEnrollmentFields(props: SignupEnrollmentFieldsProps) {
  return <AcademicGroupFields {...props} />;
}
