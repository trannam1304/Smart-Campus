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
import { FloorUtilizationItem } from '../../utils/adminAnalytics';
import { Layers } from 'lucide-react';

interface FloorUtilizationChartProps {
  data: FloorUtilizationItem[];
  selectedDate: string;
}

const getBarColor = (percent: number): string => {
  if (percent === 0) return '#cbd5e1';
  if (percent < 30) return '#2563eb';
  if (percent < 70) return '#4f46e5';
  return '#059669';
};

export const FloorUtilizationChart: React.FC<FloorUtilizationChartProps> = ({
  data,
  selectedDate,
}) => {
  const hasAnyBooking = data.some((item) => item.percentage > 0);

  const chartData = data.map((item) => ({
    ...item,
    hoursBooked: (item.totalBookedMinutes / 60).toFixed(1),
    hoursOpen: (item.totalOpenMinutes / 60).toFixed(1),
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow min-w-0 overflow-hidden space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">
              Tỷ lệ lấp đầy theo tầng (Cả 6 tầng)
            </h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              Công suất tính theo tổng phút đã đặt / tổng phút mở cửa các phòng trong ngày {selectedDate}
            </p>
          </div>
        </div>
      </div>

      <div className="w-full h-64 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 6, right: 24, left: 8, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="floorCode"
              width={96}
              axisLine={false}
              tickLine={false}
              tick={(props: any) => {
                const { x, y, payload } = props;
                return (
                  <text
                    x={x - 6}
                    y={y}
                    dy={4}
                    textAnchor="end"
                    fill="#0f172a"
                    fontSize={11}
                    fontWeight={700}
                  >
                    {payload?.value}
                  </text>
                );
              }}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs space-y-1">
                    <div className="font-bold text-slate-900">
                      {d.floorCode} • {d.totalRooms} phòng
                    </div>
                    <div className="text-[11px] text-slate-500">{d.floorDescription}</div>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-4">
                      <span className="text-slate-600">Tỷ lệ lấp đầy:</span>
                      <span className="font-black text-blue-600">{d.percentage}%</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Thời gian đặt:</span>
                      <span className="font-semibold text-slate-800">
                        {d.hoursBooked}h / {d.hoursOpen}h
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="percentage"
              name="Tỷ lệ lấp đầy (%)"
              radius={[0, 6, 6, 0]}
              barSize={18}
              animationDuration={500}
            >
              {chartData.map((entry) => (
                <Cell key={entry.floorNumber} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chú thích mức độ lấp đầy */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> &lt; 30%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600" /> 30% – 69%
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> &ge; 70%
          </span>
        </div>
        {!hasAnyBooking && (
          <span className="italic text-slate-400">
            Chưa có lượt đặt nào cho ngày {selectedDate}
          </span>
        )}
      </div>
    </div>
  );
};
