import type { StudentSubjectPerformance } from '@/api/student.api';
import { MasteryDonutChart } from '@/components/charts/MasteryDonutChart';

interface SubjectDonutChartProps {
  data: StudentSubjectPerformance[];
}

export function SubjectDonutChart({ data }: SubjectDonutChartProps) {
  const slices = data.map((row) => ({
    label: row.subject,
    score: row.score,
    answeredCount: row.answeredCount,
    correctCount: row.correctCount,
  }));

  return <MasteryDonutChart data={slices} volumeContext="your practice" />;
}
