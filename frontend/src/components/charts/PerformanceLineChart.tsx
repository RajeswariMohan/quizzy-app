import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ChartPoint } from '@/types/dashboard';

interface PerformanceLineChartProps {
  data: ChartPoint[];
}

export function PerformanceLineChart({ data }: PerformanceLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-primary-hex, #5D5FEF)"
          strokeWidth={3}
          dot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
