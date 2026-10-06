import React from 'react';

export const HourlyBookingsChart: React.FC = () => {
  const hours = [
    { time: '08:00', count: 4 },
    { time: '10:00', count: 9 },
    { time: '12:00', count: 3 },
    { time: '14:00', count: 8 },
    { time: '16:00', count: 6 },
    { time: '18:00', count: 2 },
  ];

  const max = 10;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h4 className="text-base font-bold text-slate-900 mb-4">Mật độ đặt phòng theo khung giờ trong ngày</h4>
      <div className="flex items-end justify-between gap-2 h-40 pt-4">
        {hours.map((h, idx) => {
          const heightPercent = (h.count / max) * 100;
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
              <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                {h.count} ca
              </span>
              <div className="w-full bg-slate-100 rounded-t-lg h-full flex items-end overflow-hidden">
                <div
                  className="w-full bg-blue-600 group-hover:bg-blue-700 rounded-t-lg transition-all duration-300"
                  style={{ height: `${heightPercent}%` }}
                ></div>
              </div>
              <span className="text-[11px] font-semibold text-slate-600">{h.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
