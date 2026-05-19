import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_COLORS } from '../../utils/constants';

interface AllocationPieProps {
  data: { name: string; value: number }[];
  height?: number;
}

const COLORS = ['#3b82f6', '#00C853', '#FFB300', '#FF1744', '#9333ea', '#06b6d4'];

export function AllocationPie({ data, height = 250 }: AllocationPieProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '8px', color: '#fff' }}
          formatter={(value: number) => [`${value.toFixed(2)}`, '']}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
