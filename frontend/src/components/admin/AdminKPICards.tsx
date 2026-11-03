import React from 'react';
import { Building2, CalendarCheck, AlertTriangle, TrendingUp, Wrench, Clock } from 'lucide-react';

interface KPICardsProps {
  totalRooms: number;
  maintenanceRooms: number;
  activeBookings: number;
  pendingApprovals: number;
  openIncidents: number;
  utilizationRate: number;
  selectedDate: string;
}

export const AdminKPICards: React.FC<KPICardsProps> = ({
  totalRooms,
  maintenanceRooms,
  activeBookings,
  pendingApprovals,
  openIncidents,
  utilizationRate,
  selectedDate,
}) => {
  const cards = [
    {
      title: 'Tổng số phòng học',
      value: totalRooms,
      icon: Building2,
      color: 'text-blue-600 bg-blue-50',
      subtext: `${totalRooms - maintenanceRooms} phòng đang mở`,
    },
    {
      title: 'Phòng đang bảo trì',
      value: maintenanceRooms,
      icon: Wrench,
      color: 'text-amber-600 bg-amber-50',
      subtext: maintenanceRooms > 0 ? 'Đang tạm dừng nhận đặt' : 'Tất cả phòng hoạt động tốt',
    },
    {
      title: 'Lượt đặt trong ngày',
      value: activeBookings,
      icon: CalendarCheck,
      color: 'text-emerald-600 bg-emerald-50',
      subtext: `Ngày ${selectedDate}`,
    },
    {
      title: 'Đơn chờ duyệt',
      value: pendingApprovals,
      icon: Clock,
      color: 'text-purple-600 bg-purple-50',
      subtext: pendingApprovals > 0 ? 'Cần xử lý phê duyệt' : 'Đã duyệt tất cả',
    },
    {
      title: 'Sự cố thiết bị mở',
      value: openIncidents,
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50',
      subtext: openIncidents > 0 ? 'Cần nhân viên sửa chữa' : 'Không có sự cố tồn đọng',
    },
    {
      title: 'Tỷ lệ sử dụng hiện tại',
      value: `${utilizationRate}%`,
      icon: TrendingUp,
      color: 'text-indigo-600 bg-indigo-50',
      subtext: 'Theo khung giờ hiện tại',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-w-0"
          >
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-[11px] font-bold text-slate-500 leading-tight">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-xl sm:text-2xl font-black text-slate-900">{card.value}</span>
              <span className="text-[10px] font-semibold text-slate-400 block truncate" title={card.subtext}>
                {card.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
