import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { QRModal } from '../../components/booking/QRModal';
import { Toast } from '../../components/ui/Toast';
import { Booking } from '../../types/booking';
import {
  Calendar,
  Clock,
  QrCode,
  MapPin,
  LogOut,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  XCircle,
  CalendarDays,
  X,
} from 'lucide-react';
import { checkoutApi } from '../../api/checkinApi';
import { getMyBookingsApi } from '../../api/bookingApi';
import { getErrorMessage } from '../../api/errorMessages';
import { useAuth } from '../../context/AuthContext';

interface CheckinCountdownProps {
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: string;
}

// ─── Component hiển thị tiến trình và đếm ngược thời gian check-in ────────────
const CheckinCountdown: React.FC<CheckinCountdownProps> = ({
  bookingDate,
  startTime,
  endTime,
  status,
}) => {
  const [displayState, setDisplayState] = useState<{
    type: 'WAITING' | 'IN_WINDOW' | 'EXPIRED' | 'ENDED' | 'IN_USE' | 'COMPLETED' | 'PENDING';
    text: string;
  }>({ type: 'WAITING', text: '' });

  useEffect(() => {
    const update = () => {
      if (status === 'PENDING_APPROVAL') {
        setDisplayState({
          type: 'PENDING',
          text: 'Chờ Quản trị viên phê duyệt đơn',
        });
        return;
      }
      if (status === 'IN_USE') {
        setDisplayState({
          type: 'IN_USE',
          text: 'Phòng đang được sử dụng',
        });
        return;
      }
      if (status === 'COMPLETED' || status === 'COMPLETED_FORCE') {
        setDisplayState({
          type: 'COMPLETED',
          text: 'Đã hoàn thành lượt đặt',
        });
        return;
      }
      if (status.startsWith('CANCELLED')) {
        setDisplayState({
          type: 'ENDED',
          text: 'Đơn đặt phòng đã bị hủy',
        });
        return;
      }

      // Xử lý trạng thái CONFIRMED (Đã duyệt, chuẩn bị hoặc đang trong giờ check-in)
      const now = new Date();
      const [year, month, day] = bookingDate.split('-').map(Number);
      const [sH, sM] = (startTime || '07:30').split(':').map(Number);
      const [eH, eM] = (endTime || '09:00').split(':').map(Number);

      const start = new Date(year, month - 1, day, sH, sM);
      const end = new Date(year, month - 1, day, eH, eM);

      // Cửa sổ check-in: từ sớm 15 phút đến trễ 15 phút so với giờ hẹn
      const earliest = new Date(start.getTime() - 15 * 60 * 1000);
      const latest = new Date(start.getTime() + 15 * 60 * 1000);

      const latestTimeStr = latest.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (now < earliest) {
        const diffMs = earliest.getTime() - now.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        let text = 'Check-in sau: ';
        if (diffDays > 0) text += `${diffDays} ngày `;
        if (diffHours > 0 || diffDays > 0) text += `${diffHours} giờ `;
        text += `${diffMins} phút`;

        setDisplayState({ type: 'WAITING', text });
      } else if (now >= earliest && now <= latest) {
        setDisplayState({
          type: 'IN_WINDOW',
          text: `Đang trong thời gian check-in (Đến ${latestTimeStr})`,
        });
      } else if (now > latest && now <= end) {
        setDisplayState({
          type: 'EXPIRED',
          text: 'Đã quá thời hạn check-in (+15 phút so với giờ hẹn)',
        });
      } else {
        setDisplayState({
          type: 'ENDED',
          text: 'Đã kết thúc thời gian đặt phòng',
        });
      }
    };

    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, [bookingDate, startTime, endTime, status]);

  if (displayState.type === 'IN_WINDOW') {
    return (
      <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-lg border border-emerald-300 mt-2 flex items-center justify-center gap-1.5 shadow-sm animate-pulse">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>{displayState.text}</span>
      </div>
    );
  }

  if (displayState.type === 'EXPIRED') {
    return (
      <div className="text-[11px] font-bold text-rose-700 bg-rose-50 py-1.5 px-3 rounded-lg border border-rose-300 mt-2 flex items-center justify-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
        <span>{displayState.text}</span>
      </div>
    );
  }

  if (displayState.type === 'ENDED') {
    return (
      <div className="text-[11px] font-semibold text-slate-500 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 mt-2 flex items-center justify-center gap-1.5">
        <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>{displayState.text}</span>
      </div>
    );
  }

  return (
    <div className="text-[11px] font-bold text-amber-700 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200 mt-2 flex items-center justify-center gap-1.5">
      <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span>{displayState.text}</span>
    </div>
  );
};

// Định dạng tiêu đề ngày theo tiếng Việt
const formatDateHeader = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const weekday = dateObj.toLocaleDateString('vi-VN', { weekday: 'long' });
    const capitalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalizedWeekday}, ngày ${d}/${m}/${y}`;
  } catch {
    return dateStr;
  }
};

export const MyBookingsPage: React.FC = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  // ─── Filter States ───────────────────────────────────────────────────────────
  const [filterDate, setFilterDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIRMED' | 'IN_USE' | 'HISTORY'>('ALL');
  const [searchRoom, setSearchRoom] = useState<string>('');

  const previousBookingsRef = useRef<Booking[]>([]);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const res = await getMyBookingsApi();
      if (res.success && res.data) {
        const newBookings: Booking[] = res.data;

        // Check for status transitions (e.g. PENDING_APPROVAL -> CONFIRMED or CANCELLED_ADMIN)
        if (previousBookingsRef.current.length > 0) {
          newBookings.forEach((nb) => {
            const old = previousBookingsRef.current.find((ob) => ob.id === nb.id);
            if (old && old.status !== nb.status) {
              if (old.status === 'PENDING_APPROVAL' && nb.status === 'CONFIRMED') {
                setToastType('success');
                setToastMessage(`Đơn đặt phòng ${nb.roomCode} đã được Quản trị viên duyệt thành công!`);
              } else if (old.status === 'PENDING_APPROVAL' && nb.status === 'CANCELLED_ADMIN') {
                setToastType('error');
                setToastMessage(`Đơn đặt phòng ${nb.roomCode} đã bị Quản trị viên từ chối.`);
              }
            }
          });
        }

        previousBookingsRef.current = newBookings;
        setBookings(newBookings);
      } else {
        setError(getErrorMessage(res));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleShowQR = (b: Booking) => {
    setSelectedBooking(b);
    setIsQRModalOpen(true);
  };

  const handleCheckout = async (bookingId: string) => {
    setLoadingCheckout(bookingId);
    try {
      const res = await checkoutApi({ bookingId });
      if (res.success) {
        setToastType('success');
        setToastMessage(res.message || 'Đã trả phòng thành công');
        fetchBookings(true);
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    } finally {
      setLoadingCheckout(null);
    }
  };

  // ─── Đếm số lượng theo trạng thái ──────────────────────────────────────────
  const counts = useMemo(() => {
    return {
      all: bookings.length,
      pending: bookings.filter((b) => b.status === 'PENDING_APPROVAL').length,
      confirmed: bookings.filter((b) => b.status === 'CONFIRMED').length,
      inUse: bookings.filter((b) => b.status === 'IN_USE').length,
      history: bookings.filter((b) => b.status !== 'CONFIRMED' && b.status !== 'IN_USE' && b.status !== 'PENDING_APPROVAL').length,
    };
  }, [bookings]);

  // ─── Lọc danh sách booking ──────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Lọc theo ngày
      if (filterDate && b.date !== filterDate) return false;

      // 2. Lọc theo trạng thái
      if (statusFilter === 'PENDING' && b.status !== 'PENDING_APPROVAL') return false;
      if (statusFilter === 'CONFIRMED' && b.status !== 'CONFIRMED') return false;
      if (statusFilter === 'IN_USE' && b.status !== 'IN_USE') return false;
      if (statusFilter === 'HISTORY' && (b.status === 'CONFIRMED' || b.status === 'IN_USE' || b.status === 'PENDING_APPROVAL')) return false;

      // 3. Lọc theo từ khóa phòng
      if (searchRoom.trim()) {
        const query = searchRoom.trim().toLowerCase();
        const roomCodeStr = String(b.roomCode || '').toLowerCase();
        if (!roomCodeStr.includes(query)) return false;
      }

      return true;
    });
  }, [bookings, filterDate, statusFilter, searchRoom]);

  // ─── Nhóm các booking theo ngày để sinh viên dễ theo dõi ──────────────────────
  const groupedBookings = useMemo(() => {
    const map = new Map<string, Booking[]>();
    // Sắp xếp ngày gần nhất lên trước
    const sorted = [...filteredBookings].sort((a, b) => {
      const dateA = String(a.date || '');
      const dateB = String(b.date || '');
      const cmp = dateB.localeCompare(dateA);
      if (cmp !== 0) return cmp;
      return String(b.startTime || '').localeCompare(String(a.startTime || ''));
    });

    sorted.forEach((item) => {
      const d = item.date || 'Khác';
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(item);
    });
    return Array.from(map.entries());
  }, [filteredBookings]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  }, []);

  const hasActiveFilters = !!(filterDate || statusFilter !== 'ALL' || searchRoom);

  const clearAllFilters = () => {
    setFilterDate('');
    setStatusFilter('ALL');
    setSearchRoom('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Lịch Đặt Phòng Của Tôi</h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Theo dõi, quản lý tiến độ phê duyệt và mã QR điểm danh các lượt đặt phòng học nhóm của bạn
          </p>
        </div>
      </div>

      {/* ─── Thanh Bộ Lọc & Tìm Kiếm ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        {/* Hàng 1: Tabs Trạng thái */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
              statusFilter === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Tất cả ({counts.all})
          </button>
          <button
            onClick={() => setStatusFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Chờ duyệt ({counts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
              statusFilter === 'CONFIRMED'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Sắp tới ({counts.confirmed})
          </button>
          <button
            onClick={() => setStatusFilter('IN_USE')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
              statusFilter === 'IN_USE'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Đang dùng ({counts.inUse})
          </button>
          <button
            onClick={() => setStatusFilter('HISTORY')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap border ${
              statusFilter === 'HISTORY'
                ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Lịch sử ({counts.history})
          </button>
        </div>

        {/* Hàng 2: Bộ lọc ngày & Ô tìm kiếm */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          {/* Lọc theo ngày */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Xem theo ngày:</span>
            </div>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50 text-slate-800"
            />
            <button
              onClick={() => setFilterDate(todayStr)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                filterDate === todayStr
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Hôm nay
            </button>
            <button
              onClick={() => setFilterDate(tomorrowStr)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border ${
                filterDate === tomorrowStr
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Ngày mai
            </button>
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="text-xs text-rose-600 hover:underline font-semibold ml-1"
              >
                Tất cả ngày
              </button>
            )}
          </div>

          {/* Ô tìm kiếm mã phòng */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[180px]">
              <input
                type="text"
                placeholder="Tìm mã phòng..."
                value={searchRoom}
                onChange={(e) => setSearchRoom(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="px-2.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold hover:bg-rose-50 transition-colors flex items-center gap-1 shrink-0"
                title="Xóa toàn bộ bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-sm font-semibold">Đang tải lịch đặt phòng...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-200 flex flex-col items-center text-center">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="font-bold">{error}</p>
          <button
            onClick={() => fetchBookings(false)}
            className="mt-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-100"
          >
            Thử lại
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 flex flex-col items-center text-center text-slate-500 space-y-3">
          <Calendar className="w-12 h-12 text-slate-300" />
          <p className="font-bold text-slate-600">
            {hasActiveFilters
              ? 'Không tìm thấy lịch đặt nào phù hợp với bộ lọc.'
              : 'Bạn chưa có lịch đặt phòng nào.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Xóa bộ lọc để xem tất cả
            </button>
          )}
        </div>
      ) : (
        /* Danh sách booking nhóm theo từng ngày */
        <div className="space-y-8">
          {groupedBookings.map(([dateKey, dayBookings]) => (
            <div key={dateKey} className="space-y-3">
              {/* Tiêu đề nhóm ngày */}
              <div className="flex items-center gap-2 px-1">
                <CalendarDays className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                  {formatDateHeader(dateKey)}
                </h2>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full ml-1">
                  {dayBookings.length} lượt đặt
                </span>
              </div>

              {/* Lưới các thẻ phòng của ngày đó */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {dayBookings.map((b) => {
                  const isOwner = !user?.studentCode || b.studentCode === user.studentCode;
                  const checkedInCount =
                    b.checkedInCount ??
                    Math.max(
                      b.members?.filter((m) => !!m.checkedInAt).length || 0,
                      b.status === 'IN_USE' || b.status === 'COMPLETED' ? 1 : 0
                    );
                  const totalMembers = b.totalMembers || b.members?.length || b.numberOfPeople || 1;

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                              {b.id}
                            </span>
                            {isOwner ? (
                              <span className="text-[11px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                                Chủ phòng
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                                Thành viên <span className="text-slate-500">(Chủ phòng: {b.studentName})</span>
                              </span>
                            )}
                          </div>
                          <StatusBadge status={b.status} />
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Phòng {b.roomCode}</h3>
                          <p className="text-xs text-slate-500 font-medium">
                            {b.roomType} • {b.building} - {b.floorCode}
                          </p>
                        </div>

                        <div className="space-y-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl mt-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>
                              Ngày: <strong>{b.date}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span>
                              Khung giờ: <strong>{b.startTime} - {b.endTime}</strong>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span>
                              Sức chứa đăng ký: <strong>{b.numberOfPeople} người</strong>
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 border-t border-slate-200/60 pt-1.5 mt-1.5">
                            Mục đích: <span className="font-medium text-slate-700">{b.purpose}</span>
                          </div>
                        </div>

                        {/* Thông báo chi tiết trạng thái */}
                        {b.status === 'PENDING_APPROVAL' && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Đang chờ Quản trị viên/Quản lý duyệt</span>
                            </div>
                            <p className="text-[11px] text-amber-700 leading-relaxed">
                              Đơn đặt phòng cần được phê duyệt trước khi sử dụng. Mã QR nhận phòng sẽ tự động được cấp sau khi đơn được duyệt.
                            </p>
                          </div>
                        )}

                        {b.status === 'CANCELLED_ADMIN' && (
                          <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-rose-700">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Đơn đặt phòng bị từ chối</span>
                            </div>
                            <p className="text-[11px] text-rose-700">
                              Lý do: <span className="font-bold">{b.cancelReason || 'Không có lý do cụ thể'}</span>
                            </p>
                          </div>
                        )}

                        {b.status === 'CANCELLED_AUTO' && (
                          <div className="mt-3 p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 space-y-1">
                            <div className="font-bold flex items-center gap-1.5 text-rose-700">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>Tự động hủy và trả phòng</span>
                            </div>
                            <p className="text-[11px] text-rose-700">
                              Đơn đặt phòng đã được hệ thống tự động trả phòng và giải phóng do quá 15 phút thời hạn check-in mà không có thành viên nào quét mã nhận phòng.
                            </p>
                          </div>
                        )}

                        {/* Tiến trình và đếm ngược giờ check-in */}
                        <CheckinCountdown
                          bookingDate={b.date}
                          startTime={b.startTime}
                          endTime={b.endTime}
                          status={b.status}
                        />

                        {b.status === 'IN_USE' && (
                          <div className="mt-3 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold flex items-center gap-1.5 text-emerald-900">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Tiến độ điểm danh:</span>
                              </span>
                              <span className="font-bold bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-md text-xs">
                                {checkedInCount}/{totalMembers} người
                              </span>
                            </div>

                            <div className="pt-2 border-t border-emerald-200/80 text-[11px] space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-600 font-medium">Người đang sử dụng:</span>
                                <span className="font-bold text-slate-900">
                                  {b.studentName || 'Sinh viên'} {b.studentCode ? `(${b.studentCode})` : ''}
                                </span>
                              </div>
                              {b.checkInTime && (
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-600 font-medium">Thời gian check-in:</span>
                                  <span className="font-mono font-bold text-emerald-700">
                                    {b.checkInTime.includes('T') ? b.checkInTime.split('T')[1].slice(0, 5) : b.checkInTime.slice(0, 5)}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Danh sách thành viên đăng ký */}
                            {b.members && b.members.length > 0 && (
                              <div className="pt-2 border-t border-emerald-200/80 space-y-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block">Thành viên phòng:</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {b.members.map((m, idx) => {
                                    const isChecked = !!m.checkedInAt || idx === 0 || (checkedInCount > 0 && idx < checkedInCount);
                                    return (
                                      <span
                                        key={m.studentCode || idx}
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                          isChecked
                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                            : 'bg-white text-slate-600 border border-slate-200'
                                        }`}
                                      >
                                        <span className={`w-1.5 h-1.5 rounded-full ${isChecked ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                                        <span>{m.studentCode}</span>
                                        <span className="text-[9px] opacity-75">({isChecked ? 'Đã vào' : 'Chưa'})</span>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Nút hành động */}
                      <div className="mt-4 flex gap-2">
                        {b.status === 'CONFIRMED' && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={() => handleShowQR(b)}
                              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px]"
                            >
                              <QrCode className="w-4 h-4 text-blue-400" />
                              <span>Xem mã QR điểm danh</span>
                            </button>
                            <button
                              onClick={() => handleCheckout(b.id)}
                              disabled={loadingCheckout === b.id}
                              className="py-2.5 px-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 font-bold text-xs hover:bg-rose-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[44px] shrink-0"
                              title="Hủy đặt và trả phòng sớm"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>{loadingCheckout === b.id ? '...' : 'Trả phòng'}</span>
                            </button>
                          </div>
                        )}
                        {b.status === 'IN_USE' && (
                          <button
                            onClick={() => handleCheckout(b.id)}
                            disabled={loadingCheckout === b.id}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 min-h-[44px]"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>{loadingCheckout === b.id ? 'Đang xử lý...' : 'Trả phòng'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <QRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        booking={selectedBooking}
      />

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
