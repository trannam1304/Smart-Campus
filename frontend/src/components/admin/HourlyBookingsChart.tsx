import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { HourlyBookingItem } from '../../utils/adminAnalytics';
import { Clock } from 'lucide-react';

interface HourlyBookingsChartProps {
  hours: HourlyBookingItem[];
  peakHour: string;
  peakCount: number;
  maxCount: number;
  selectedDate: string;
}

export const HourlyBookingsChart: React.FC<HourlyBookingsChartProps> = ({
  hours,
  peakHour,
  peakCount,
  maxCount,
  selectedDate,
}) => {
  const chartData = hours.map((h) => ({
    ...h,
    shortHour: `${h.time.split(':')[0]}h`,
    rangeLabel: `${String(h.hour).padStart(2, '0')}:00 – ${String(h.hour + 1).padStart(2, '0')}:00`,
    isPeak: h.count === peakCount && peakCount > 0,
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow min-w-0 overflow-hidden space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Clock className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">
              Mật độ đặt phòng theo khung giờ (07:00 – 20:00)
            </h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              Số lượt phòng được sử dụng trong ngày {selectedDate}
            </p>
          </div>
        </div>

        {peakCount > 0 ? (
          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 self-start sm:self-auto shrink-0">
            Cao điểm: {peakHour} ({peakCount} lượt)
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-medium self-start sm:self-auto shrink-0">
            Chưa có lượt đặt
          </span>
        )}
      </div>

      <div className="w-full h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="shortHour"
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              interval={0}
              tick={(props: any) => {
                const { x, y, payload } = props;
                return (
                  <text
                    x={x}
                    y={y + 12}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={11}
                    fontWeight={600}
                  >
                    {payload?.value}
                  </text>
                );
              }}
            />
            <YAxis
              allowDecimals={false}
              domain={[0, Math.max(5, maxCount)]}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs space-y-1">
                    <div className="font-bold text-slate-900">Khung giờ {d.rangeLabel}</div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Số phòng sử dụng:</span>
                      <span className={`font-black ${d.isPeak ? 'text-amber-600' : 'text-blue-600'}`}>
                        {d.count} lượt
                      </span>
                    </div>
                    {d.isPeak && (
                      <div className="text-[10px] font-bold text-amber-600">★ Khung giờ cao điểm</div>
                    )}
                  </div>
                );
              }}
            />
            <Bar
              dataKey="count"
              name="Số lượt đặt"
              radius={[6, 6, 0, 0]}
              maxBarSize={28}
              animationDuration={500}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.hour}
                  fill={entry.isPeak ? '#f59e0b' : entry.count > 0 ? '#2563eb' : '#e2e8f0'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Giờ bình thường
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Khung giờ cao điểm
        </span>
      </div>
    </div>
  );
};
