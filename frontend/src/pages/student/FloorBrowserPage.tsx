import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getRoomsApi } from '../../api/roomApi';
import { Room } from '../../types/booking';
import { BookingModal } from '../../components/booking/BookingModal';
import { RoomTimelineModal } from '../../components/booking/RoomTimelineModal';
import { QRModal } from '../../components/booking/QRModal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Toast } from '../../components/ui/Toast';
import { FloorNavBar } from '../../components/booking/FloorNavBar';
import { useActiveFloor } from '../../hooks/useActiveFloor';
import { minOccupancy } from '../../utils/bookingValidation';
import { getErrorMessage } from '../../api/errorMessages';
import {
  Search,
  Filter,
  Users,
  Bookmark,
  Calendar,
  AlertTriangle,
  MapPin,
  Loader2,
  RefreshCw,
  Monitor,
  Tv,
} from 'lucide-react';

// ─── Kiểu floor section được build từ dữ liệu rooms ─────────────────────────
interface FloorSection {
  floorNumber: number;
  floorCode: string;
  description: string;
  rooms: Room[];
  totalRooms: number;
  availableRooms: number;
}

const FLOOR_META: { floorNumber: number; floorCode: string; description: string }[] = [
  { floorNumber: 0, floorCode: 'G - Floor', description: 'Tầng G – Sảnh Đọc & Phòng học nhóm (L.001 – L.002), Thuyết trình (L.003, L.005) & Video (L.004)' },
  { floorNumber: 1, floorCode: '1st - Floor', description: 'Tầng 1 – Phòng học nhóm (L.101 – L.103), Thuyết trình (L.104 – L.105) & Hội nghị (L.106)' },
  { floorNumber: 2, floorCode: '2nd - Floor', description: 'Tầng 2 – Phòng học nhóm (L.201 – L.202), Video (L.203) & Thuyết trình (L.204)' },
  { floorNumber: 3, floorCode: '3rd - Floor', description: 'Tầng 3 – Phòng tự học (L.301 – L.303), Video (L.304), Thuyết trình (L.305) & Học nhóm (L.306)' },
  { floorNumber: 4, floorCode: '4th - Floor', description: 'Tầng 4 – Phòng tự học (L.401 – L.403), Thuyết trình (L.404, L.406) & Video (L.405)' },
  { floorNumber: 5, floorCode: '5th - Floor', description: 'Tầng 5 – Phòng học nhóm (L.501 – L.502), Video (L.503), Thuyết trình (L.504 – L.505) & Hội nghị (L.506)' },
];

// ─── Skeleton card ────────────────────────────────────────────────────────────
const RoomCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse space-y-3">
    <div className="flex justify-between">
      <div className="space-y-1.5">
        <div className="h-4 w-24 bg-slate-200 rounded" />
        <div className="h-3 w-36 bg-slate-100 rounded" />
      </div>
      <div className="h-6 w-16 bg-slate-200 rounded-full" />
    </div>
    <div className="h-8 bg-slate-100 rounded-xl" />
    <div className="flex gap-1.5">
      <div className="h-6 w-20 bg-slate-100 rounded-md" />
      <div className="h-6 w-24 bg-slate-100 rounded-md" />
    </div>
    <div className="flex gap-2 pt-2 border-t border-slate-100">
      <div className="h-9 flex-1 bg-slate-200 rounded-xl" />
      <div className="h-9 w-24 bg-slate-100 rounded-xl" />
      <div className="h-9 w-9 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

// ─── Thẻ phòng ───────────────────────────────────────────────────────────────
interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
  onViewSchedule: (room: Room) => void;
  onReportIncident: (room: Room) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onBook, onViewSchedule, onReportIncident }) => {
  const isAvailable = room.status === 'AVAILABLE';
  const isMaintenance = room.status === 'MAINTENANCE';
  const isBooked = room.status === 'BOOKED' || room.status === 'SELF_BOOKED';
  const min = minOccupancy(room.capacity);

  const disabledReason = isMaintenance
    ? 'Phòng đang bảo trì'
    : isBooked
    ? 'Phòng đã được đặt trong khung giờ này'
    : !isAvailable
    ? 'Phòng không khả dụng'
    : '';

  // Hiển thị tối đa 4 thiết bị, còn lại gộp "+N"
  const maxDevices = 4;
  const shownDevices = room.devices.slice(0, maxDevices);
  const extraCount = room.devices.length - maxDevices;

  return (
    <div
      className={`bg-white rounded-2xl border transition-all flex flex-col justify-between group shadow-sm hover:shadow-md ${
        isMaintenance
          ? 'border-amber-200 bg-amber-50/30'
          : isBooked
          ? 'border-rose-200'
          : 'border-slate-200'
      }`}
    >
      <div className="p-5 space-y-3">
        {/* Header: mã phòng + badge trạng thái */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors">
              Phòng {room.roomCode}
            </h4>
            <p className="text-xs text-slate-500 font-medium">{room.roomType}</p>
          </div>
          <StatusBadge status={room.status} />
        </div>

        {/* Sức chứa */}
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-xl px-3 py-2">
          <Users className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            Sức chứa: <strong className="text-slate-800">{min} – {room.capacity} người</strong>
            <span className="text-slate-400 ml-1">(tối thiểu 50%)</span>
          </span>
        </div>

        {/* Thiết bị rút gọn */}
        {room.devices.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {shownDevices.map((dev) => (
              <span
                key={dev.id}
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md ${
                  dev.status === 'GOOD'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-rose-100 text-rose-700 font-semibold'
                }`}
              >
                {dev.name.toLowerCase().includes('tv') || dev.name.toLowerCase().includes('màn hình') ? (
                  <Tv className="w-3 h-3" />
                ) : (
                  <Monitor className="w-3 h-3" />
                )}
                {dev.name}
                {dev.status !== 'GOOD' && ' (Hỏng)'}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="inline-flex items-center text-[11px] font-medium px-2 py-1 rounded-md bg-slate-100 text-slate-500">
                +{extraCount} khác
              </span>
            )}
          </div>
        )}

        {/* Lý do không khả dụng */}
        {!isAvailable && disabledReason && (
          <p className="text-[11px] text-rose-600 font-semibold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
            ⚠ {disabledReason}
          </p>
        )}
      </div>

      {/* Footer hành động */}
      <div className="flex items-center gap-2 px-5 pb-5 border-t border-slate-100 pt-3">
        <button
          onClick={() => onBook(room)}
          disabled={!isAvailable}
          title={!isAvailable ? disabledReason : 'Đặt phòng'}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            isAvailable
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{isAvailable ? 'Đặt phòng' : 'Không khả dụng'}</span>
        </button>

        <button
          onClick={() => onViewSchedule(room)}
          title="Xem lịch bận"
          className="py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1"
        >
          <Calendar className="w-3.5 h-3.5 text-blue-600" />
          <span className="hidden sm:inline">Xem lịch</span>
        </button>

        <button
          onClick={() => onReportIncident(room)}
          title="Báo sự cố"
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ─── Trang chính ──────────────────────────────────────────────────────────────
export const FloorBrowserPage: React.FC = () => {
  const navigate = useNavigate();

  // ── Bộ lọc ──────────────────────────────────────────────────────────────────
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const nowTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState(nowTimeStr);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roomTypeFilter, setRoomTypeFilter] = useState('ALL');

  // ── Dữ liệu ─────────────────────────────────────────────────────────────────
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRoomsApi({ date, startTime });
      if (res.success && res.data) {
        setRooms(res.data.items);
      } else {
        throw new Error(getErrorMessage(res));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [date, startTime]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [defaultDate, setDefaultDate] = useState('');
  const [defaultStartTime, setDefaultStartTime] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [scheduleRoom, setScheduleRoom] = useState<Room | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  const [qrData, setQrData] = useState</* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType] = useState<'success' | 'error'>('success');

  const handleBook = (room: Room, dDate?: string, dTime?: string) => {
    setSelectedRoom(room);
    setDefaultDate(dDate ?? date);
    setDefaultStartTime(dTime ?? startTime);
    setIsModalOpen(true);
  };

  const handleViewSchedule = (room: Room) => {
    setScheduleRoom(room);
    setIsTimelineOpen(true);
  };

  const handleReportIncident = (room: Room) => {
    navigate('/incident-report', { state: { roomId: room.id, roomCode: room.roomCode } });
  };

  const handleBookingSuccess = (booking: /* eslint-disable-next-line @typescript-eslint/no-explicit-any */ any) => {
    if (booking.bookingStatus === 'PENDING_APPROVAL') {
      setToastMessage('Đã gửi yêu cầu đặt phòng hội nghị. Vui lòng chờ Quản trị viên phê duyệt.');
    } else {
      setQrData(booking);
    }
  };

  // ── Lọc & nhóm theo tầng ────────────────────────────────────────────────────
  const filteredRooms = rooms.filter((room) => {
    const matchSearch =
      room.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.roomType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || room.status === statusFilter;
    const matchRoomType = roomTypeFilter === 'ALL' || room.roomType === roomTypeFilter;
    return matchSearch && matchStatus && matchRoomType;
  });

  const floorSections: FloorSection[] = FLOOR_META.map((meta) => {
    const floorRooms = filteredRooms.filter((r) => r.floor === meta.floorNumber);
    const allFloorRooms = rooms.filter((r) => r.floor === meta.floorNumber);
    return {
      ...meta,
      rooms: floorRooms,
      totalRooms: allFloorRooms.length,
      availableRooms: allFloorRooms.filter((r) => r.status === 'AVAILABLE').length,
    };
  });

  const totalShown = filteredRooms.length;

  // ── Điều hướng tầng & cuộn mượt ──────────────────────────────────────────────
  const sectionIds = useMemo(() => {
    return floorSections
      .filter((s) => s.rooms.length > 0)
      .map((s) => `floor-${s.floorNumber}`);
  }, [floorSections]);

  const { activeFloor, setClickedFloor } = useActiveFloor(sectionIds);

  const handleSelectFloor = (floorNumber: number) => {
    setClickedFloor(floorNumber);
    const el = document.getElementById(`floor-${floorNumber}`);
    if (el) {
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

      el.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  };

  const navFloors = FLOOR_META.map((meta) => {
    const section = floorSections.find((s) => s.floorNumber === meta.floorNumber);
    const hasRooms = (section?.rooms.length ?? 0) > 0;
    return {
      floorNumber: meta.floorNumber,
      label: meta.floorNumber === 0 ? 'G' : String(meta.floorNumber),
      disabled: isLoading || !hasRooms,
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* ── Header Banner ───────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Đặt Phòng Thư Viện Tòa L</h1>
          <p className="text-sm text-blue-100 mt-1">
            Duyệt và đặt phòng trực tiếp từ danh sách bên dưới.
          </p>
        </div>
        <Link
          to="/architectural-map"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold border border-white/30 transition-colors backdrop-blur-sm shrink-0"
        >
          <MapPin className="w-3.5 h-3.5" />
          Xem trên sơ đồ
        </Link>
      </div>

      {/* ── Bộ lọc ngày / giờ ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        {/* Dòng 1: Tìm phòng + Trạng thái */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Tìm theo mã phòng (L.001, L.101)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Bộ lọc: Trạng thái & Loại phòng */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Lọc theo trạng thái"
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="AVAILABLE">Còn trống</option>
                <option value="BOOKED">Đã đặt</option>
                <option value="MAINTENANCE">Đang bảo trì</option>
              </select>
            </div>

            <select
              value={roomTypeFilter}
              onChange={(e) => setRoomTypeFilter(e.target.value)}
              aria-label="Lọc theo loại phòng"
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800"
            >
              <option value="ALL">Tất cả loại phòng</option>
              <option value="Phòng học nhóm">Phòng học nhóm</option>
              <option value="Phòng thuyết trình">Phòng thuyết trình</option>
              <option value="Phòng video">Phòng video</option>
              <option value="Phòng tự học">Phòng tự học</option>
              <option value="Phòng hội nghị">Phòng hội nghị</option>
            </select>
          </div>
        </div>

        {/* Dòng 2: Chọn ngày / giờ xem trạng thái */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs font-bold text-slate-600 shrink-0">Xem trạng thái lúc:</span>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="datetime-input text-xs"
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="datetime-input text-xs"
            />
            <button
              onClick={fetchRooms}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors disabled:opacity-60 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Cập nhật
            </button>
          </div>
          {!isLoading && !error && (
            <span className="text-xs text-slate-400 font-medium ml-auto">
              {totalShown} phòng phù hợp
            </span>
          )}
        </div>
      </div>

      {/* ── Bố cục 2 cột (Desktop) / Thanh tầng dính (Mobile) + Nội dung ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <FloorNavBar
          floors={navFloors}
          activeFloor={activeFloor}
          onSelect={handleSelectFloor}
        />

        <div className="flex-1 min-w-0 w-full">
          {isLoading ? (
            <div className="space-y-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => <RoomCardSkeleton key={j} />)}
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 text-rose-700 p-8 rounded-2xl border border-rose-200 flex flex-col items-center text-center space-y-3">
              <AlertTriangle className="w-10 h-10" />
              <p className="font-bold text-base">{error}</p>
              <button
                onClick={fetchRooms}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-xl text-xs font-semibold border border-rose-200 hover:bg-rose-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Thử lại
              </button>
            </div>
          ) : totalShown === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">Không tìm thấy phòng nào</p>
              <p className="text-xs">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {floorSections.map((section) => {
                if (section.rooms.length === 0) return null;
                return (
                  <section
                    key={section.floorNumber}
                    id={`floor-${section.floorNumber}`}
                    className="scroll-mt-32 lg:scroll-mt-24 space-y-4"
                  >
                    {/* Tiêu đề tầng */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white rounded-2xl border border-slate-200 px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center shrink-0 text-sm">
                          {section.floorNumber === 0 ? 'G' : section.floorNumber}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900 whitespace-nowrap">{section.floorCode}</h3>
                          <p className="text-xs text-slate-500 font-medium">{section.description}</p>
                        </div>
                      </div>
                      <span
                        className={`self-start sm:self-auto inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          section.availableRooms > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {section.availableRooms}/{section.totalRooms} phòng trống
                      </span>
                    </div>

                    {/* Lưới thẻ phòng */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {section.rooms.map((room) => (
                        <RoomCard
                          key={room.id}
                          room={room}
                          onBook={handleBook}
                          onViewSchedule={handleViewSchedule}
                          onReportIncident={handleReportIncident}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        room={selectedRoom}
        onSuccess={handleBookingSuccess}
        defaultDate={defaultDate}
        defaultStartTime={defaultStartTime}
      />

      <QRModal
        isOpen={!!qrData}
        onClose={() => setQrData(null)}
        booking={qrData}
      />

      <RoomTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        room={scheduleRoom}
        onSelectSlot={(d, t) => {
          handleBook(scheduleRoom!, d, t);
        }}
      />

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};
