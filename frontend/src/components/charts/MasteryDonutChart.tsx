import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { MasterySlice } from '@/types/mastery';

const COLORS = ['#5D5FEF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

interface MasteryDonutChartProps {
  data: MasterySlice[];
  /** Shown in tooltip after volume share, e.g. "your practice" or "responses". */
  volumeContext?: string;
}

export function MasteryDonutChart({ data, volumeContext = 'responses' }: MasteryDonutChartProps) {
  const totalAnswered = data.reduce((sum, row) => sum + row.answeredCount, 0);
  const chartData = data.map((row) => ({ ...row, name: row.label }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="answeredCount"
          nameKey="name"
          innerRadius={60}
          outerRadius={88}
          paddingAngle={2}
        >
          {chartData.map((row, index) => (
            <Cell key={row.label} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(_value: number, _name, item) => {
            const row = item.payload as MasterySlice & { name: string };
            const share =
              totalAnswered > 0
                ? Math.round((100 * row.answeredCount) / totalAnswered)
                : 0;
            return [
              `${row.score}% accuracy · ${row.correctCount}/${row.answeredCount} correct · ${share}% of ${volumeContext}`,
              row.label,
            ];
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={48}
          iconType="circle"
          formatter={(value: string) => {
            const row = data.find((d) => d.label === value);
            if (!row) return value;
            return `${value} (${row.score}%)`;
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
