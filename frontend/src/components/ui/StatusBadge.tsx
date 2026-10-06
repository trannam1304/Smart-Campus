import React from 'react';
import { RoomStatus, BookingStatus } from '../../types/booking';
import { getRoomColor } from '../../utils/roomColors';

interface StatusBadgeProps {
  status: RoomStatus | BookingStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  if (['AVAILABLE', 'BOOKED', 'MAINTENANCE', 'SELF_BOOKED'].includes(status)) {
    const color = getRoomColor(status as RoomStatus);
    return (
      <span 
        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border"
        style={{ backgroundColor: color.fill, borderColor: color.stroke, color: color.text }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color.bgHex }}></span>
        {color.label}
      </span>
    );
  }

  // Handle other booking statuses explicitly
  switch (status) {
    case 'IN_USE':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          Đang sử dụng
        </span>
      );
    case 'CONFIRMED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          Đã xác nhận
        </span>
      );
    case 'PENDING_APPROVAL':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
          Đang chờ duyệt
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Đã hoàn thành
        </span>
      );
    case 'CANCELLED_AUTO':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
          Hủy tự động (Quá hạn)
        </span>
      );
    case 'CANCELLED_USER':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          Bạn đã hủy
        </span>
      );
    case 'CANCELLED_ADMIN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
          Hủy bởi Admin
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
          {status}
        </span>
      );
  }
};
