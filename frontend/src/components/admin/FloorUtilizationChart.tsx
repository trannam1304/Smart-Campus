import React from 'react';

export const FloorUtilizationChart: React.FC = () => {
  const floorData = [
    { floor: 'Tầng 1 (Học nhóm)', percentage: 85, color: 'bg-blue-600' },
    { floor: 'Tầng 2 (Yên tĩnh)', percentage: 60, color: 'bg-indigo-600' },
    { floor: 'Tầng 3 (Hội thảo)', percentage: 40, color: 'bg-emerald-600' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <h4 className="text-base font-bold text-slate-900 mb-4">Tỷ lệ lấp đầy theo tầng</h4>
      <div className="space-y-4">
        {floorData.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-semibold text-slate-700">
              <span>{item.floor}</span>
              <span>{item.percentage}% công suất</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-500`}
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
