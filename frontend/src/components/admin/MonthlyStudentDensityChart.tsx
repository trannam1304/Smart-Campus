import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MonthlyStudentDensityResult } from '../../utils/adminAnalytics';
import { Users } from 'lucide-react';

export interface MonthlyStudentDensityChartProps {
  data: MonthlyStudentDensityResult;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export const MonthlyStudentDensityChart: React.FC<MonthlyStudentDensityChartProps> = ({
  data,
  selectedMonth,
  onMonthChange,
}) => {
  const [yearStr, monthStr] = data.month.split('-');
  const displayMonth = `${monthStr}/${yearStr}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow min-w-0 overflow-hidden space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">
              Mật độ số lượng sinh viên đặt phòng các ngày theo tháng
            </h4>
            <p className="text-xs text-slate-500">
              Thống kê số sinh viên đăng ký sử dụng phòng từng ngày trong tháng {displayMonth}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="monthly-density-month"
              className="text-xs font-semibold text-slate-600 whitespace-nowrap"
            >
              Chọn tháng:
            </label>
            <input
              id="monthly-density-month"
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value) onMonthChange(e.target.value);
              }}
              className="datetime-input text-xs"
            />
          </div>

          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
            Tổng: {data.totalStudents} SV ({data.totalBookings} lượt)
          </span>

          {data.peakStudents > 0 && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              Cao điểm: {data.peakDay} ({data.peakStudents} SV)
            </span>
          )}
        </div>
      </div>

      <div className="w-full h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data.days}
            margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis
              dataKey="label"
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={8}
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
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-lg px-3.5 py-2.5 text-xs space-y-1">
                    <div className="font-bold text-slate-900">
                      Ngày {d.label}/{displayMonth}
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Số lượng sinh viên:</span>
                      <span className="font-black text-blue-600">{d.studentCount} sinh viên</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">Số lượt đặt phòng:</span>
                      <span className="font-bold text-emerald-600">{d.bookingCount} lượt</span>
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '6px' }}
            />
            <Line
              type="monotone"
              dataKey="studentCount"
              name="Số lượng sinh viên đặt phòng"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#2563eb', strokeWidth: 1.5, stroke: '#ffffff' }}
              activeDot={{ r: 6, fill: '#1d4ed8', stroke: '#ffffff', strokeWidth: 2 }}
              animationDuration={600}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {data.totalStudents === 0 && (
        <p className="text-center text-xs text-slate-400 italic">
          Chưa có lượt đặt phòng nào được ghi nhận trong tháng {displayMonth}.
        </p>
      )}
    </div>
  );
};
