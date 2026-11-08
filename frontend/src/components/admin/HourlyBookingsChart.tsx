import React from 'react';
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
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm min-w-0 overflow-hidden space-y-4">
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
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 self-start sm:self-auto shrink-0">
            Cao điểm: {peakHour} ({peakCount} lượt)
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-medium self-start sm:self-auto shrink-0">
            Chưa có lượt đặt
          </span>
        )}
      </div>

      <div className="min-w-0 overflow-hidden">
        <div className="flex items-end gap-1.5 h-44 pt-4 overflow-x-auto pb-2">
          {hours.map((h, idx) => {
            const heightPercent = maxCount > 0 ? (h.count / maxCount) * 100 : 0;
            const isPeak = h.count === peakCount && peakCount > 0;

            return (
              <div key={idx} className="flex-1 min-w-[28px] flex flex-col items-center gap-1.5 group shrink-0">
                <span
                  className={`text-[10px] font-bold transition-opacity ${
                    h.count > 0
                      ? isPeak
                        ? 'text-amber-600 opacity-100'
                        : 'text-slate-600 opacity-0 group-hover:opacity-100'
                      : 'text-slate-300 opacity-0'
                  }`}
                >
                  {h.count}
                </span>
                <div className="w-full bg-slate-100 rounded-t-lg h-32 flex items-end overflow-hidden">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-300 ${
                      isPeak
                        ? 'bg-amber-500 group-hover:bg-amber-600'
                        : h.count > 0
                        ? 'bg-blue-600 group-hover:bg-blue-700'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(h.count > 0 ? 8 : 0, heightPercent)}%` }}
                  ></div>
                </div>
                <span
                  className={`text-[10px] font-semibold whitespace-nowrap ${
                    idx % 2 !== 0 ? 'hidden sm:block ' : ''
                  }${isPeak ? 'text-blue-700 font-bold' : 'text-slate-500'}`}
                >
                  {h.time.split(':')[0]}h
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
