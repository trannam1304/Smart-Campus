import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Building2, CalendarCheck, QrCode, Wrench, Search, MapPin } from 'lucide-react';

export const MobileFooterNav: React.FC = () => {
  const location = useLocation();

  const items = [
    { label: 'Sơ đồ Lib', path: '/architectural-map', icon: MapPin },
    { label: 'Đặt phòng', path: '/browse', icon: Building2 },
    { label: 'Tìm phòng', path: '/search-rooms', icon: Search },
    { label: 'Quét QR', path: '/checkin', icon: QrCode },
    { label: 'Lịch của tôi', path: '/my-bookings', icon: CalendarCheck },
  ];

  return (
    <div className="xl:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-2 px-2 shadow-lg">
      <div className="flex justify-around items-center">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
