/**
 * 최근 24시간 PM10/PM2.5 추이 그래프.
 * recharts LineChart를 사용하며 ResponsiveContainer로 반응형을 지원한다.
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { HourlyDataPoint } from '@airmate/shared';

interface HourlyChartProps {
  data: HourlyDataPoint[];
  textColor?: string;
}

export function HourlyChart({ data, textColor = 'white' }: HourlyChartProps) {
  // X축 레이블: 데이터가 많을 때 일부만 표시 (4시간 간격)
  const tickFormatter = (value: string) => {
    const hour = parseInt(value.split(':')[0], 10);
    return hour % 4 === 0 ? value : '';
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -8, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
          <XAxis
            dataKey="time"
            tickFormatter={tickFormatter}
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.3)' }}
            tickLine={false}
            unit="㎍"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 12,
              color: textColor,
              fontSize: 12,
            }}
            labelStyle={{ fontWeight: 'bold', marginBottom: 4 }}
            formatter={(value, name) => [
              value != null ? `${value} ㎍/㎥` : '–',
              name ?? '',
            ]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.85)' }}
          />
          <Line
            type="monotone"
            dataKey="pm10"
            name="PM10"
            stroke="#60a5fa"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="pm25"
            name="PM2.5"
            stroke="#f87171"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
