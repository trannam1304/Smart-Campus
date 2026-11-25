import React, { useState, useMemo } from 'react';
import { Booking } from '../../types/booking';
import { StatusBadge } from '../ui/StatusBadge';
import { Search, Filter, ArrowUpDown, ArrowRight, Calendar, DoorClosed, RotateCcw, X, RefreshCw } from 'lucide-react';

interface AdminBookingTableProps {
  bookings: Booking[];
  onNavigateToApproval?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

type StatusFilterType =
  | 'ALL'
  | 'PENDING_APPROVAL'
  | 'CONFIRMED'
  | 'IN_USE'
  | 'COMPLETED'
  | 'CANCELLED';

export const AdminBookingTable: React.FC<AdminBookingTableProps> = ({
  bookings,
  onNavigateToApproval,
  onRefresh,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST'>('NEWEST');

  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  // Danh sách các phòng duy nhất xuất hiện trong dữ liệu booking
  const uniqueRoomCodes = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (b && b.roomCode) set.add(b.roomCode);
    });
    return Array.from(set).sort();
  }, [bookings]);

  // Đếm số lượng theo trạng thái
  const statusCounts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b && b.status === 'PENDING_APPROVAL').length,
      confirmed: bookings.filter((b) => b && b.status === 'CONFIRMED').length,
      inUse: bookings.filter((b) => b && b.status === 'IN_USE').length,
      completed: bookings.filter((b) => b && b.status === 'COMPLETED').length,
      cancelled: bookings.filter(
        (b) =>
          b &&
          (b.status === 'CANCELLED_AUTO' ||
            b.status === 'CANCELLED_USER' ||
            b.status === 'CANCELLED_ADMIN')
      ).length,
    };
  }, [bookings]);

  // Lọc dữ liệu an toàn 100% không crash toLowerCase() trên null hoặc number
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (!b) return false;

        // 1. Lọc theo từ khóa tìm kiếm chung
        if (searchTerm.trim()) {
          const q = searchTerm.trim().toLowerCase();
          const matchId = String(b.id ?? '').toLowerCase().includes(q);
          const matchStudentCode = String(b.studentCode ?? '').toLowerCase().includes(q);
          const matchStudentName = String(b.studentName ?? '').toLowerCase().includes(q);
          const matchRoom = String(b.roomCode ?? '').toLowerCase().includes(q);
          const matchPurpose = String(b.purpose ?? '').toLowerCase().includes(q);
          if (!matchId && !matchStudentCode && !matchStudentName && !matchRoom && !matchPurpose) {
            return false;
          }
        }

        // 2. Lọc theo phòng cụ thể
        if (selectedRoom !== 'ALL') {
          if (b.roomCode !== selectedRoom) return false;
        }

        // 3. Lọc theo ngày đặt
        if (selectedDate) {
          if (b.date !== selectedDate) return false;
        }

        // 4. Lọc theo trạng thái
        if (statusFilter === 'ALL') return true;
        if (statusFilter === 'CANCELLED') {
          return (
            b.status === 'CANCELLED_AUTO' ||
            b.status === 'CANCELLED_USER' ||
            b.status === 'CANCELLED_ADMIN'
          );
        }
        return b.status === statusFilter;
      })
      .sort((a, b) => {
        const dateA = String(a.date || '');
        const timeA = String(a.startTime || '');
        const dateB = String(b.date || '');
        const timeB = String(b.startTime || '');

        const stampA = new Date(`${dateA}T${timeA}`).getTime() || new Date(a.createdAt || '').getTime() || 0;
        const stampB = new Date(`${dateB}T${timeB}`).getTime() || new Date(b.createdAt || '').getTime() || 0;
        return sortOrder === 'NEWEST' ? stampB - stampA : stampA - stampB;
      });
  }, [bookings, searchTerm, selectedRoom, selectedDate, statusFilter, sortOrder]);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedRoom !== 'ALL' ||
    Boolean(selectedDate) ||
    statusFilter !== 'ALL';

  const resetAllFilters = () => {
    setSearchTerm('');
    setSelectedRoom('ALL');
    setSelectedDate('');
    setStatusFilter('ALL');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-w-0 space-y-4">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <h4 className="text-base font-bold text-slate-900 truncate">Danh Sách Quản Lý Lịch Đặt Phòng</h4>
            <p className="text-xs text-slate-500">
              Quản lý toàn bộ yêu cầu và lịch đặt phòng học trong thư viện theo phòng và thời gian.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
            Hiển thị {filteredBookings.length} / {bookings.length} lượt
          </span>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none border-b border-slate-100">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Tất cả</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-bold">
              {statusCounts.all}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              statusFilter === 'PENDING_APPROVAL'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/80'
            }`}
          >
            <span>Chờ duyệt</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 font-bold">
              {statusCounts.pending}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              statusFilter === 'CONFIRMED'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/80'
            }`}
          >
            <span>Đã xác nhận</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-200/80 text-emerald-900 font-bold">
              {statusCounts.confirmed}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_USE')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              statusFilter === 'IN_USE'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/80'
            }`}
          >
            <span>Đang dùng</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-200/80 text-blue-900 font-bold">
              {statusCounts.inUse}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              statusFilter === 'COMPLETED'
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Hoàn thành</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-800 font-bold">
              {statusCounts.completed}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border flex items-center gap-1.5 ${
              statusFilter === 'CANCELLED'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/80'
            }`}
          >
            <span>Đã hủy / Từ chối</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-200/80 text-rose-900 font-bold">
              {statusCounts.cancelled}
            </span>
          </button>
        </div>

        {/* Filters bar: Search, Room filter, Date filter, Sort order */}
        <div className="flex flex-col lg:flex-row flex-wrap items-stretch lg:items-center justify-between gap-3 pt-1 min-w-0">
          {/* Ô Tìm Kiếm */}
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo mã đặt (60002), phòng (L.002), MSSV, tên..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/60"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                title="Xóa tìm kiếm"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {/* Lọc Theo Phòng */}
            <div className="flex items-center gap-1.5 min-w-0">
              <DoorClosed className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">Tất cả phòng</option>
                {uniqueRoomCodes.map((code) => (
                  <option key={code} value={code}>
                    Phòng {code}
                  </option>
                ))}
              </select>
            </div>

            {/* Lọc Theo Ngày Đặt */}
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                title="Chọn ngày đặt"
              />
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border ${
                  selectedDate === todayStr
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold border ${
                  selectedDate === tomorrowStr
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Ngày mai
              </button>
              {selectedDate && (
                <button
                  type="button"
                  onClick={() => setSelectedDate('')}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Tất cả ngày
                </button>
              )}
            </div>

            {/* Đổi chiều sắp xếp */}
            <button
              type="button"
              onClick={() => setSortOrder(sortOrder === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
              className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors shrink-0"
              title="Đổi chiều sắp xếp"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{sortOrder === 'NEWEST' ? 'Mới nhất' : 'Cũ nhất'}</span>
            </button>

            {/* Nút Làm Mới */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors shrink-0 disabled:opacity-50"
                title="Làm mới danh sách đặt phòng"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </button>
            )}

            {/* Nút Đặt Lại Bộ Lọc */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 py-2 px-3 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shrink-0"
                title="Xóa toàn bộ bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="text-center py-12 px-4 space-y-2">
          <p className="text-sm font-bold text-slate-700">Không tìm thấy lịch đặt nào phù hợp với bộ lọc hiện tại.</p>
          <p className="text-xs text-slate-400">
            Thử thay đổi từ khóa tìm kiếm, chọn lại phòng hoặc xóa bộ lọc ngày.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 shadow-xs"
            >
              Xóa bộ lọc
            </button>
          )}
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
                    #{b.id}
                  </span>
                  <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                    <StatusBadge status={b.status} />
                    {b.status === 'IN_USE' && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        {b.checkedInCount ?? (b.members?.filter((m) => !!m.checkedInAt).length || 1)}/{b.totalMembers || b.numberOfPeople || 1} đã vào
                      </span>
                    )}
                  </div>
                </div>

                {/* Student Info */}
                <div className="min-w-0">
                  <span className="block font-bold text-slate-900 text-sm break-words">{b.studentName || 'Chưa cập nhật'}</span>
                  <span className="text-[11px] text-slate-500 font-mono break-words">MSSV: {b.studentCode || 'N/A'}</span>
                  {b.status === 'IN_USE' && b.checkInTime && (
                    <span className="block text-[11px] font-semibold text-emerald-700 mt-0.5">
                      ✓ Đã nhận phòng lúc: {b.checkInTime.includes('T') ? b.checkInTime.split('T')[1].slice(0, 5) : b.checkInTime.slice(0, 5)}
                    </span>
                  )}
                </div>

                {/* Room & Time */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-50 min-w-0">
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block uppercase font-semibold">Phòng & Tầng</span>
                    <span className="font-bold text-slate-800 block break-words">Phòng {b.roomCode}</span>
                    <span className="text-[11px] text-slate-500 block whitespace-nowrap">{b.floorCode || `Tầng ${b.floor ?? ''}`}</span>
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
                    <td className="py-3 px-4 font-mono font-bold text-blue-600 min-w-0 whitespace-nowrap">#{b.id}</td>
                    <td className="py-3 px-4 min-w-0">
                      <span className="block font-bold text-slate-900 break-words">{b.studentName || 'Chưa cập nhật'}</span>
                      <span className="text-[10px] text-slate-400 font-mono break-words whitespace-nowrap">MSSV: {b.studentCode || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4 min-w-0">
                      <span className="font-bold text-slate-800 block whitespace-nowrap">Phòng {b.roomCode}</span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">{b.floorCode || `Tầng ${b.floor ?? ''}`}</span>
                    </td>
                    <td className="py-3 px-4 min-w-0">
                      <span className="font-bold text-slate-800 whitespace-nowrap">{b.date}</span>
                      <span className="block text-[10px] text-slate-500 font-mono whitespace-nowrap">
                        {b.startTime} - {b.endTime}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate min-w-0" title={b.purpose}>
                      {b.purpose || '-'}
                    </td>
                    <td className="py-3 px-4 min-w-0">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge status={b.status} />
                        {b.status === 'IN_USE' && (
                          <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <span>Điểm danh: <strong>{b.checkedInCount ?? (b.members?.filter((m) => !!m.checkedInAt).length || 1)}/{b.totalMembers || b.numberOfPeople || 1}</strong></span>
                            {b.checkInTime && (
                              <span className="block text-[9px] text-slate-500 font-mono mt-0.5">
                                Vào lúc: {b.checkInTime.includes('T') ? b.checkInTime.split('T')[1].slice(0, 5) : b.checkInTime.slice(0, 5)}
                              </span>
                            )}
                          </div>
                        )}
                        {b.status === 'CANCELLED_ADMIN' && b.cancelReason && (
                          <span className="block text-[10px] text-rose-500 mt-0.5 truncate max-w-xs break-words" title={b.cancelReason}>
                            Lý do: {b.cancelReason}
                          </span>
                        )}
                      </div>
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
