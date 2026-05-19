import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { CHART_COLORS } from '../../utils/constants';

interface PnLChartProps {
  data: { date: string; pnl: number }[];
  height?: number;
}

export function PnLChart({ data, height = 250 }: PnLChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} />
        <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} />
        <Tooltip contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '8px', color: '#fff' }} />
        <ReferenceLine y={0} stroke="#30363D" />
        <Line type="monotone" dataKey="pnl" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
