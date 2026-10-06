import React from 'react';
import { Booking } from '../../types/booking';
import { StatusBadge } from '../ui/StatusBadge';

interface AdminBookingTableProps {
  bookings: Booking[];
}

export const AdminBookingTable: React.FC<AdminBookingTableProps> = ({ bookings }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h4 className="text-base font-bold text-slate-900">Danh sách quản lý lịch đặt phòng</h4>
        <span className="text-xs font-medium text-slate-500">Tổng cộng {bookings.length} lượt</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-medium">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Mã Đặt</th>
              <th className="py-3 px-4">Sinh Viên</th>
              <th className="py-3 px-4">Phòng</th>
              <th className="py-3 px-4">Thời Gian</th>
              <th className="py-3 px-4">Mục Đích</th>
              <th className="py-3 px-4">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-3 px-4 font-mono font-bold text-blue-600">{b.id}</td>
                <td className="py-3 px-4">
                  <span className="block font-bold text-slate-900">{b.studentName}</span>
                  <span className="text-[10px] text-slate-400">{b.studentCode}</span>
                </td>
                <td className="py-3 px-4 font-bold text-slate-800">{b.roomCode}</td>
                <td className="py-3 px-4">
                  <span>{b.date}</span>
                  <span className="block text-[10px] text-slate-500">{b.startTime} - {b.endTime}</span>
                </td>
                <td className="py-3 px-4 max-w-xs truncate">{b.purpose}</td>
                <td className="py-3 px-4">
                  <StatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
