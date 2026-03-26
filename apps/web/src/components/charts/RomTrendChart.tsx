'use client';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RomTrendChartProps {
  data: { date: string; avgRom: number }[];
}

export default function RomTrendChart({ data }: RomTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        style={{
          height: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
        }}
      >
        No data yet — complete your first session to see trends.
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" />
        <XAxis
          dataKey="date"
          stroke="var(--text-muted)"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
        />
        <YAxis
          stroke="var(--text-muted)"
          tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
          unit="°"
          axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
        />
        <Tooltip
          contentStyle={{
            background: '#161B24',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '8px',
            fontSize: '0.8125rem',
            color: '#F1F5F9',
          }}
          formatter={(value: number | undefined) => [`${value ?? 0}°`, 'Avg ROM']}
        />
        <Line
          type="monotone"
          dataKey="avgRom"
          stroke="#0ECDBA"
          strokeWidth={2}
          dot={{ r: 3, fill: '#0ECDBA' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
