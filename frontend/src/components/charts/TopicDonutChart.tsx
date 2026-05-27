import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { TopicMastery } from '@/types/dashboard';

const COLORS = ['#5D5FEF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6'];

interface TopicDonutChartProps {
  data: TopicMastery[];
}

export function TopicDonutChart({ data }: TopicDonutChartProps) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="percentage"
          nameKey="topic"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [`${value}%`, name]}
        />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
