import React, { useState } from 'react';
import { Booking } from '../../types/booking';
import { StatusBadge } from '../ui/StatusBadge';
import { Search, Filter, ArrowUpDown, ArrowRight } from 'lucide-react';

interface AdminBookingTableProps {
  bookings: Booking[];
  onNavigateToApproval?: () => void;
}

type StatusFilterType =
  | 'ALL'
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'IN_USE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CANCELLED_ADMIN';

export const AdminBookingTable: React.FC<AdminBookingTableProps> = ({
  bookings,
  onNavigateToApproval,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  const filteredBookings = bookings
    .filter((b) => {
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const match =
          b.id.toLowerCase().includes(q) ||
          b.studentCode.toLowerCase().includes(q) ||
          b.studentName.toLowerCase().includes(q) ||
          b.roomCode.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'CANCELLED') {
        return b.status === 'CANCELLED_AUTO' || b.status === 'CANCELLED_USER';
      }
      return b.status === statusFilter;
    })
    .sort((a, b) => {
      const timeA = new Date(`${a.date}T${a.startTime}`).getTime() || new Date(a.createdAt).getTime();
      const timeB = new Date(`${b.date}T${b.startTime}`).getTime() || new Date(b.createdAt).getTime();
      return sortOrder === 'NEWEST' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0 space-y-4">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">Danh Sách Quản Lý Lịch Đặt Phòng</h4>
            <p className="text-xs text-slate-500">
              Quản lý toàn bộ yêu cầu và lịch đặt phòng học trong thư viện.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
            Tổng cộng {filteredBookings.length} lượt
          </span>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 pt-1 min-w-0">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đặt, MSSV, tên, phòng..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Trạng thái:</span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
              className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none max-w-full"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING_APPROVAL">Chờ duyệt</option>
              <option value="CONFIRMED">Đã xác nhận</option>
              <option value="IN_USE">Đang sử dụng</option>
              <option value="COMPLETED">Hoàn thành</option>
              <option value="CANCELLED">Đã hủy (User/Auto)</option>
              <option value="CANCELLED_ADMIN">Bị từ chối</option>
            </select>

            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
              className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors shrink-0"
              title="Đổi chiều sắp xếp"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortOrder === 'NEWEST' ? 'Mới nhất' : 'Cũ nhất'}</span>
            </button>
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 px-4 text-slate-400 text-xs font-semibold">
          Không tìm thấy lịch đặt nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <>
          {/* Mobile Cards List (< md) */}
          <div className="block md:hidden divide-y divide-slate-100 min-w-0">
            {filteredBookings.map((b) => (
              <div key={b.id} className="p-4 space-y-2.5 min-w-0">
                {/* Header row: ID & Status Badge */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 shrink-0">
                    {b.id}
                  </span>
                  <div className="shrink-0">
                    <StatusBadge status={b.status} />
                  </div>
                </div>

                {/* Student Info */}
                <div className="min-w-0">
                  <span className="block font-bold text-slate-900 text-sm break-words">{b.studentName}</span>
                  <span className="text-[11px] text-slate-500 font-mono break-words">MSSV: {b.studentCode}</span>
                </div>

                {/* Room & Time */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-50 min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Phòng & Tầng</span>
                    <span className="font-bold text-slate-800 block break-words">Phòng {b.roomCode}</span>
                    <span className="text-[11px] text-slate-500 block whitespace-nowrap">{b.floorCode}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Thời gian</span>
                    <span className="font-bold text-slate-800 block break-words">{b.date}</span>
                    <span className="text-[11px] text-slate-500 font-mono block break-words">
                      {b.startTime} - {b.endTime}
                    </span>
                  </div>
                </div>

                {/* Purpose */}
                {b.purpose && (
                  <div className="min-w-0 pt-1">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Mục đích</span>
                    <p className="text-xs text-slate-600 break-words line-clamp-2" title={b.purpose}>
                      {b.purpose}
                    </p>
                  </div>
                )}

                {/* Cancellation Reason if any */}
                {b.status === 'CANCELLED_ADMIN' && b.cancelReason && (
                  <div className="min-w-0 p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-600 break-words">
                    <span className="font-bold">Lý do từ chối: </span>{b.cancelReason}
                  </div>
                )}

                {/* Approval Action Button if PENDING_APPROVAL */}
                {b.status === 'PENDING_APPROVAL' && onNavigateToApproval && (
                  <div className="pt-1 min-w-0">
                    <button
                      type="button"
                      onClick={onNavigateToApproval}
                      className="w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 px-3 py-2 rounded-xl border border-amber-300 transition-colors"
                    >
                      <span>Duyệt đơn</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table (>= md) */}
          <div className="hidden md:block overflow-x-auto min-w-0">
            <table className="w-full text-left text-xs font-medium">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 min-w-0">Mã Đặt</th>
                  <th className="py-3 px-4 min-w-0">Sinh Viên</th>
                  <th className="py-3 px-4 min-w-0">Phòng</th>
                  <th className="py-3 px-4 min-w-0">Thời Gian</th>
                  <th className="py-3 px-4 min-w-0">Mục Đích</th>
                  <th className="py-3 px-4 min-w-0">Trạng Thái</th>
                  <th className="py-3 px-4 text-right min-w-0">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 min-w-0">{b.id}</td>
                    <td className="py-3 px-4 min-w-0">
                      <span className="block font-bold text-slate-900 break-words">{b.studentName}</span>
                      <span className="text-[10px] text-slate-400 font-mono break-words">MSSV: {b.studentCode}</span>
                    </td>
                    <td className="py-3 px-4 min-w-0">
                      <span className="font-bold text-slate-800 block break-words">Phòng {b.roomCode}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{b.floorCode}</span>
                    </td>
                    <td className="py-3 px-4 min-w-0">
                      <span className="font-bold text-slate-800 break-words">{b.date}</span>
                      <span className="block text-[10px] text-slate-500 font-mono break-words">
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate min-w-0" title={b.purpose}>
                      {b.purpose}
                    </td>
                    <td className="py-3 px-4 min-w-0">
                      <StatusBadge status={b.status} />
                      {b.status === 'CANCELLED_ADMIN' && b.cancelReason && (
                        <span className="block text-[10px] text-rose-500 mt-0.5 truncate max-w-xs break-words" title={b.cancelReason}>
                          Lý do: {b.cancelReason}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right min-w-0">
                      {b.status === 'PENDING_APPROVAL' && onNavigateToApproval ? (
                        <button
                          type="button"
                          onClick={onNavigateToApproval}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition-colors min-h-[36px]"
                        >
                          <span>Duyệt đơn</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
