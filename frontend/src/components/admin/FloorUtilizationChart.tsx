import React from 'react';
import { FloorUtilizationItem } from '../../utils/adminAnalytics';
import { Layers } from 'lucide-react';

interface FloorUtilizationChartProps {
  data: FloorUtilizationItem[];
  selectedDate: string;
}

export const FloorUtilizationChart: React.FC<FloorUtilizationChartProps> = ({
  data,
  selectedDate,
}) => {
  const getBarColor = (percent: number) => {
    if (percent === 0) return 'bg-slate-300';
    if (percent < 30) return 'bg-blue-600';
    if (percent < 70) return 'bg-indigo-600';
    return 'bg-emerald-600';
  };

  const hasAnyBooking = data.some((item) => item.percentage > 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Layers className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">Tỷ lệ lấp đầy theo tầng (Cả 6 tầng)</h4>
            <p className="text-xs text-slate-500 line-clamp-2">
              Công suất tính theo tổng phút đã đặt / tổng phút mở cửa các phòng trong ngày {selectedDate}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item) => {
          const hoursBooked = (item.totalBookedMinutes / 60).toFixed(1);
          const hoursOpen = (item.totalOpenMinutes / 60).toFixed(1);

          return (
            <div key={item.floorNumber} className="space-y-1.5 min-w-0">
              <div className="flex justify-between items-start gap-2 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-bold text-slate-900 shrink-0">{item.floorCode}</span>
                  <span className="text-[11px] text-slate-400 font-normal truncate">
                    ({item.totalRooms} phòng • {item.floorDescription})
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="font-bold text-slate-900">{item.percentage}%</span>
                  <span className="text-[10px] text-slate-400 font-normal ml-1.5 hidden sm:inline">
                    ({hoursBooked}h / {hoursOpen}h)
                  </span>
                </div>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getBarColor(
                    item.percentage
                  )} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.max(item.percentage > 0 ? 3 : 0, item.percentage)}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {!hasAnyBooking && (
        <p className="text-center text-xs text-slate-400 italic pt-2">
          Chưa có lượt đặt nào được ghi nhận cho ngày {selectedDate}.
        </p>
      )}
    </div>
  );
};
