import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_COLORS } from '../../utils/constants';

interface PriceChartProps {
  data: { time: string; price: number }[];
  height?: number;
}

export function PriceChart({ data, height = 300 }: PriceChartProps) {
  const isUp = data.length >= 2 && data[data.length - 1].price >= data[0].price;
  const color = isUp ? CHART_COLORS.profit : CHART_COLORS.loss;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis dataKey="time" tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: CHART_COLORS.text, fontSize: 11 }} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
        <Tooltip
          contentStyle={{ background: '#161B22', border: '1px solid #21262D', borderRadius: '8px', color: '#fff' }}
          labelStyle={{ color: '#8b949e' }}
        />
        <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill="url(#priceGradient)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
