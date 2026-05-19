interface RiskGaugeProps {
  value: number;
  max: number;
  label: string;
}

export function RiskGauge({ value, max, label }: RiskGaugeProps) {
  const pct = Math.min((value / max) * 100, 100);
  const color = pct < 50 ? '#00C853' : pct < 75 ? '#FFB300' : '#FF1744';
  const rotation = -90 + (pct / 100) * 180;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-16 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="#21262D" strokeWidth="8" strokeLinecap="round" />
          <path
            d="M 10 55 A 50 50 0 0 1 110 55"
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${pct * 1.57} 157`}
          />
        </svg>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
          <span className="text-lg font-bold" style={{ color }}>{value.toFixed(1)}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
    </div>
  );
}
