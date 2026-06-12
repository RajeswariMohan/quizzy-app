import { useMemo } from 'react';
import { FieldSelect } from '@/components/ui/FieldSelect';
import { QuizTopicField } from '@/components/quiz/QuizTopicField';
import { mergeGradeOptions } from '@/utils/academicOptions';
import {
  coerceSubjectForGradeForm,
  getLinkedGradeOptions,
  getQuizFormSubjectOptions,
  type QuizAcademicLink,
} from '@/utils/quizFilters';

interface QuizAcademicFieldsProps {
  academicLinks: QuizAcademicLink[];
  schoolGrades: string[];
  schoolSubjects: string[];
  grade: string;
  subject: string;
  topic: string;
  onGradeChange: (grade: string) => void;
  onSubjectChange: (subject: string) => void;
  onTopicChange: (topic: string) => void;
  disabled?: boolean;
  gradeRequired?: boolean;
}

export function QuizAcademicFields({
  academicLinks,
  schoolGrades,
  schoolSubjects,
  grade,
  subject,
  topic,
  onGradeChange,
  onSubjectChange,
  onTopicChange,
  disabled = false,
  gradeRequired = false,
}: QuizAcademicFieldsProps) {
  const useLinked = academicLinks.length > 0;

  const gradeOptions = useMemo(() => {
    const linked = getLinkedGradeOptions(academicLinks, grade, schoolGrades);
    const base = useLinked ? mergeGradeOptions(schoolGrades, linked) : schoolGrades;
    const list = [...base];
    if (grade && !list.includes(grade)) list.unshift(grade);
    return list;
  }, [academicLinks, schoolGrades, grade, useLinked]);

  const subjectOptions = useMemo(
    () => getQuizFormSubjectOptions(academicLinks, grade, schoolSubjects, subject),
    [academicLinks, grade, schoolSubjects, subject],
  );

  const handleGradeChange = (nextGrade: string) => {
    const nextSubject = coerceSubjectForGradeForm(
      subject,
      academicLinks,
      nextGrade,
      schoolSubjects,
    );
    onGradeChange(nextGrade);
    if (nextSubject !== subject) onSubjectChange(nextSubject);
  };

  const handleSubjectChange = (nextSubject: string) => {
    onSubjectChange(nextSubject);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <FieldSelect
          label="Grade"
          value={grade}
          options={gradeOptions}
          onChange={handleGradeChange}
          disabled={disabled}
          required={gradeRequired}
        />
        <FieldSelect
          label="Subject"
          value={subject}
          options={subjectOptions}
          onChange={handleSubjectChange}
          disabled={disabled}
        />
      </div>
      <QuizTopicField
        topicLinks={academicLinks}
        grade={grade}
        subject={subject}
        topic={topic}
        onChange={onTopicChange}
        disabled={disabled}
      />
    </>
  );
}
