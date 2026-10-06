import React from 'react';
import { Building2, CalendarCheck, AlertTriangle, TrendingUp } from 'lucide-react';

interface KPICardsProps {
  totalRooms: number;
  activeBookings: number;
  openIncidents: number;
  utilizationRate: number;
}

export const AdminKPICards: React.FC<KPICardsProps> = ({
  totalRooms,
  activeBookings,
  openIncidents,
  utilizationRate,
}) => {
  const cards = [
    { title: 'Tổng số phòng học', value: totalRooms, icon: Building2, color: 'text-blue-600 bg-blue-50', change: '+2 phòng mới' },
    { title: 'Lịch đang hoạt động', value: activeBookings, icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50', change: 'Hạn mức ổn định' },
    { title: 'Sự cố thiết bị hỏng', value: openIncidents, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50', change: 'Cần xử lý ngay' },
    { title: 'Tỷ lệ sử dụng phòng', value: `${utilizationRate}%`, icon: TrendingUp, color: 'text-indigo-600 bg-indigo-50', change: 'Giờ cao điểm' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500">{card.title}</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-slate-900">{card.value}</span>
              <span className="text-[11px] font-bold text-slate-400">{card.change}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
