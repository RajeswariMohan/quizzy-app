import { Download, Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ClassBarChart } from '@/components/charts/ClassBarChart';
import { TopicDonutChart } from '@/components/charts/TopicDonutChart';
import { QuizCreatorForm } from '@/components/quiz/QuizCreatorForm';
import type { ChartPoint, TopicMastery } from '@/types/dashboard';

const STATS = [
  { label: 'Total Students', value: '42' },
  { label: 'Quizzes Conducted', value: '12' },
  { label: 'Avg Accuracy', value: '76%' },
  { label: 'Top Score', value: '98%' },
];

const QUIZ_PERFORMANCE: ChartPoint[] = [
  { label: 'Quiz 1', value: 68 },
  { label: 'Quiz 2', value: 72 },
  { label: 'Quiz 3', value: 81 },
  { label: 'Quiz 4', value: 76 },
  { label: 'Quiz 5', value: 88 },
];

const TOPICS: TopicMastery[] = [
  { topic: 'Life Processes', percentage: 88 },
  { topic: 'Cells', percentage: 74 },
  { topic: 'Motion', percentage: 62 },
];

const RECENT_QUIZZES = [
  { name: 'Photosynthesis', class: '8-A', questions: 20, avg: '76%' },
  { name: 'Cell Structure', class: '8-A', questions: 15, avg: '82%' },
  { name: 'Motion Basics', class: '8-B', questions: 18, avg: '71%' },
];

const TOP_STUDENTS = [
  { rank: 1, name: 'Aarav S.', score: '98%' },
  { rank: 2, name: 'Priya M.', score: '94%' },
  { rank: 3, name: 'Rohan K.', score: '91%' },
];

export function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-muted">Class 8-A · Science · This term</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <option>Class 8-A</option>
            <option>Class 8-B</option>
          </select>
          <select className="rounded-xl border border-gray-200 px-3 py-2 text-sm">
            <option>Science</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATS.map((s) => (
          <Card key={s.label} className="!p-4">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-ink">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Class performance</CardTitle>
          <ClassBarChart data={QUIZ_PERFORMANCE} />
        </Card>
        <Card>
          <CardTitle>Topic-wise performance</CardTitle>
          <TopicDonutChart data={TOPICS} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Recent quizzes</CardTitle>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="pb-2">Quiz</th>
                  <th className="pb-2">Class</th>
                  <th className="pb-2">Qs</th>
                  <th className="pb-2">Avg</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {RECENT_QUIZZES.map((q) => (
                  <tr key={q.name} className="border-t border-gray-100">
                    <td className="py-2.5 font-medium">{q.name}</td>
                    <td className="py-2.5">{q.class}</td>
                    <td className="py-2.5">{q.questions}</td>
                    <td className="py-2.5">{q.avg}</td>
                    <td className="py-2.5 text-right text-primary">View</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Top students
          </CardTitle>
          <ul className="mt-4 space-y-3">
            {TOP_STUDENTS.map((s) => (
              <li
                key={s.rank}
                className="flex items-center justify-between rounded-xl bg-surface px-4 py-3"
              >
                <span className="font-medium">
                  #{s.rank} {s.name}
                </span>
                <span className="text-primary">{s.score}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Quiz creator</h2>
        <QuizCreatorForm />
      </div>
    </div>
  );
}
