import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminKPICards } from '../../components/admin/AdminKPICards';
import { FloorUtilizationChart } from '../../components/admin/FloorUtilizationChart';
import { HourlyBookingsChart } from '../../components/admin/HourlyBookingsChart';
import { MonthlyStudentDensityChart } from '../../components/admin/MonthlyStudentDensityChart';
import { RoomUtilizationTable } from '../../components/admin/RoomUtilizationTable';
import { AdminBookingTable } from '../../components/admin/AdminBookingTable';
import { AdminViolations } from '../../components/admin/AdminViolations';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Toast } from '../../components/ui/Toast';
import { Modal } from '../../components/ui/Modal';
import { IncidentReportForm } from '../../components/incident/IncidentReportForm';
import {
  ShieldCheck,
  Check,
  X,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  Plus,
  Filter,
  Calendar,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  getAdminDashboardDataApi,
  updateRoomStatusApi,
  resolveIncidentApi,
  approveBookingApi,
  rejectBookingApi,
} from '../../api/adminApi';
import { getRoomsApi } from '../../api/roomApi';
import { getErrorMessage } from '../../api/errorMessages';
import { Booking, Room } from '../../types/booking';
import { isUpcomingBooking } from '../../utils/bookingValidation';
import { useBooking } from '../../context/BookingContext';
import {
  calculateFloorUtilization,
  calculateHourlyBookings,
  calculateKPISummary,
  calculateMonthlyStudentDensity,
  calculateRoomUtilization,
} from '../../utils/adminAnalytics';

const VALID_TABS = ['OVERVIEW', 'ROOMS', 'REGISTRATIONS', 'BOOKINGS', 'INCIDENTS', 'VIOLATIONS'] as const;
type AdminTab = typeof VALID_TABS[number];

const resolveIncidentImageUrl = (rawUrl?: string): string => {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('data:') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  if (trimmed.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  if (trimmed.startsWith('iVBOR')) {
    return `data:image/png;base64,${trimmed}`;
  }
  if (trimmed.startsWith('UklGR')) {
    return `data:image/webp;base64,${trimmed}`;
  }
  const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const apiBase = import.meta.env.VITE_API_BASE_URL || '';
  if (apiBase.startsWith('http')) {
    try {
      const origin = new URL(apiBase).origin;
      return `${origin}${normalizedPath}`;
    } catch {
      // ignore invalid URL
    }
  }
  return normalizedPath;
};

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { floors } = useBooking();

  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');
  const activeTab: AdminTab = VALID_TABS.includes(tabParam as AdminTab)
    ? (tabParam as AdminTab)
    : 'OVERVIEW';

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for room management tab
  const [roomSearchTerm, setRoomSearchTerm] = useState('');
  const [loadingRoomId, setLoadingRoomId] = useState<string | null>(null);
  const [maintenanceModal, setMaintenanceModal] = useState<{
    room: Room;
    upcomingCount: number;
  } | null>(null);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [maintenanceReasonError, setMaintenanceReasonError] = useState<string | null>(null);
  const [viewMaintenanceModal, setViewMaintenanceModal] = useState<Room | null>(null);

  // States for booking approval tab
  const [loadingApprovalId, setLoadingApprovalId] = useState<string | null>(null);
  const [rejectBookingModal, setRejectBookingModal] = useState<Booking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // States for incident management
  const [isCreateIncidentModalOpen, setIsCreateIncidentModalOpen] = useState(false);
  const [selectedIncidentImage, setSelectedIncidentImage] = useState<{ url: string; title: string } | null>(null);
  const [incidentStatusFilter, setIncidentStatusFilter] = useState<'ALL' | 'OPEN' | 'RESOLVED'>('ALL');
  const [incidentTimeFilter, setIncidentTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('ALL');
  const [incidentCustomDate, setIncidentCustomDate] = useState<string>('');
  const [incidentSearchQuery, setIncidentSearchQuery] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const formatIncidentDateTime = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr.replace(' ', 'T'));
    if (isNaN(d.getTime())) return dateStr;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  };

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    setError(null);
    try {
      // Tải song song dữ liệu dashboard và danh sách phòng (kèm phòng bảo trì cho admin)
      const [dashRes, roomsRes] = await Promise.all([
        getAdminDashboardDataApi(),
        getRoomsApi({ includeMaintenance: true }),
      ]);
      if (dashRes.success) {
        setBookings(dashRes.data.bookings || []);
        setIncidents(dashRes.data.incidents || []);
      } else {
        throw new Error(getErrorMessage(dashRes));
      }

      if (roomsRes.success && roomsRes.data) {
        setAllRooms(roomsRes.data.items);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (isInitial) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
  }, [fetchData]);

  useEffect(() => {
    if (tabParam && !VALID_TABS.includes(tabParam as AdminTab)) {
      navigate('/admin?tab=OVERVIEW', { replace: true });
    }
  }, [tabParam, navigate]);

  // Bấm nút Bảo trì: luôn mở popup yêu cầu nhập lý do
  const handleOpenMaintenanceModal = (room: Room) => {
    const upcoming = bookings.filter(
      (b) => (b.roomId === room.id || b.roomCode === room.roomCode) && isUpcomingBooking(b)
    );

    setMaintenanceModal({
      room,
      upcomingCount: upcoming.length,
    });
    setMaintenanceReason('');
    setMaintenanceReasonError(null);
  };

  // Thực hiện đổi trạng thái phòng mà không tải lại toàn bộ trang
  const executeUpdateRoomStatus = async (
    room: Room,
    status: 'AVAILABLE' | 'MAINTENANCE',
    reason?: string
  ) => {
    setLoadingRoomId(room.id);
    try {
      const res = await updateRoomStatusApi(room.id, status, reason);
      if (res.success) {
        const isMaint = status === 'MAINTENANCE';
        const trimmedReason = reason?.trim() || '';
        const fullCancelReason = trimmedReason ? `Phòng bảo trì: ${trimmedReason}` : 'Phòng bảo trì';

        // Cập nhật trạng thái phòng trực tiếp trong state
        setAllRooms((prev) =>
          prev.map((r) =>
            r.id === room.id
              ? {
                  ...r,
                  maintenance: isMaint,
                  maintenanceReason: isMaint ? trimmedReason : undefined,
                  status: isMaint ? 'MAINTENANCE' : 'AVAILABLE',
                }
              : r
          )
        );

        // Nếu chuyển sang bảo trì, cập nhật các booking sắp tới của phòng thành CANCELLED_ADMIN
        if (isMaint) {
          setBookings((prev) =>
            prev.map((b) =>
              (b.roomId === room.id || b.roomCode === room.roomCode) && isUpcomingBooking(b)
                ? { ...b, status: 'CANCELLED_ADMIN', cancelReason: fullCancelReason }
                : b
            )
          );
        }

        setToastType('success');
        setToastMessage(res.message);
        setMaintenanceModal(null);
        setViewMaintenanceModal(null);
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    } finally {
      setLoadingRoomId(null);
    }
  };

  // Duyệt đơn đặt phòng
  const handleApproveBooking = async (booking: Booking) => {
    setLoadingApprovalId(booking.id);
    try {
      const res = await approveBookingApi(booking.id);
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === booking.id
              ? ((res.data as Booking) || { ...b, status: 'CONFIRMED' })
              : b
          )
        );
        setToastType('success');
        setToastMessage(res.message);
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    } finally {
      setLoadingApprovalId(null);
    }
  };

  // Mở modal từ chối đơn đặt phòng
  const handleOpenRejectModal = (booking: Booking) => {
    setRejectBookingModal(booking);
    setRejectReason('');
    setRejectError(null);
  };

  // Xác nhận từ chối đơn đặt phòng
  const handleConfirmReject = async () => {
    if (!rejectBookingModal) return;
    if (!rejectReason.trim()) {
      setRejectError('Vui lòng nhập lý do từ chối đơn đặt phòng');
      return;
    }

    setLoadingApprovalId(rejectBookingModal.id);
    try {
      const res = await rejectBookingApi(rejectBookingModal.id, rejectReason.trim());
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === rejectBookingModal.id
              ? {
                  ...b,
                  status: 'CANCELLED_ADMIN',
                  cancelReason: rejectReason.trim(),
                  qrCode: '',
                }
              : b
          )
        );
        setToastType('success');
        setToastMessage(res.message);
        setRejectBookingModal(null);
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    } finally {
      setLoadingApprovalId(null);
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await resolveIncidentApi(incidentId);
      if (res.success) {
        setToastType('success');
        setToastMessage(res.message);
        setIncidents((prev) =>
          prev.map((i) => (i.id === incidentId ? { ...i, status: 'RESOLVED' } : i))
        );
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    }
  };

  const filteredRooms = allRooms.filter((r) =>
    r.roomCode.toLowerCase().includes(roomSearchTerm.trim().toLowerCase())
  );

  const pendingBookings = bookings.filter((b) => b.status === 'PENDING_APPROVAL');
  const floorNumbers = [0, 1, 2, 3, 4, 5];

  const kpiSummary = useMemo(
    () => calculateKPISummary(allRooms, bookings, incidents, selectedDate),
    [allRooms, bookings, incidents, selectedDate]
  );

  const floorUtilizationData = useMemo(
    () => calculateFloorUtilization(floors, allRooms, bookings, selectedDate),
    [floors, allRooms, bookings, selectedDate]
  );

  const hourlyBookingsData = useMemo(
    () => calculateHourlyBookings(bookings, selectedDate),
    [bookings, selectedDate]
  );

  const roomUtilizationData = useMemo(
    () => calculateRoomUtilization(allRooms, bookings, selectedDate),
    [allRooms, bookings, selectedDate]
  );

  const monthlyStudentDensityData = useMemo(
    () => calculateMonthlyStudentDensity(bookings, selectedMonth),
    [bookings, selectedMonth]
  );

  const incidentStats = useMemo(() => {
    const total = incidents.length;
    const open = incidents.filter((i) => i.status === 'OPEN').length;
    const resolved = incidents.filter((i) => i.status !== 'OPEN').length;
    return { total, open, resolved };
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      // 1. Lọc theo trạng thái xử lý
      if (incidentStatusFilter === 'OPEN' && inc.status !== 'OPEN') return false;
      if (incidentStatusFilter === 'RESOLVED' && inc.status === 'OPEN') return false;

      // 2. Lọc theo từ khóa tìm kiếm
      if (incidentSearchQuery.trim()) {
        const q = incidentSearchQuery.trim().toLowerCase();
        const matchRoom = (inc.roomCode || inc.roomId || '').toLowerCase().includes(q);
        const matchDevice = (inc.deviceName || '').toLowerCase().includes(q);
        const matchDesc = (inc.description || '').toLowerCase().includes(q);
        const matchReporter = (inc.reporterName || '').toLowerCase().includes(q);
        const matchCode = (inc.reporterCode || '').toLowerCase().includes(q);
        if (!matchRoom && !matchDevice && !matchDesc && !matchReporter && !matchCode) {
          return false;
        }
      }

      // 3. Lọc theo thời gian
      if (incidentTimeFilter !== 'ALL' && inc.createdAt) {
        const incDate = new Date(inc.createdAt.includes('T') ? inc.createdAt : inc.createdAt.replace(' ', 'T'));
        if (!isNaN(incDate.getTime())) {
          const now = new Date();
          if (incidentTimeFilter === 'TODAY') {
            const isToday =
              incDate.getFullYear() === now.getFullYear() &&
              incDate.getMonth() === now.getMonth() &&
              incDate.getDate() === now.getDate();
            if (!isToday) return false;
          } else if (incidentTimeFilter === 'WEEK') {
            const diffMs = now.getTime() - incDate.getTime();
            if (diffMs < -86400000 || diffMs > 7 * 86400000) return false;
          } else if (incidentTimeFilter === 'MONTH') {
            const diffMs = now.getTime() - incDate.getTime();
            if (diffMs < -86400000 || diffMs > 30 * 86400000) return false;
          } else if (incidentTimeFilter === 'CUSTOM' && incidentCustomDate) {
            const [y, m, d] = incidentCustomDate.split('-').map(Number);
            const isMatch =
              incDate.getFullYear() === y &&
              incDate.getMonth() === m - 1 &&
              incDate.getDate() === d;
            if (!isMatch) return false;
          }
        }
      }

      return true;
    });
  }, [incidents, incidentStatusFilter, incidentTimeFilter, incidentCustomDate, incidentSearchQuery]);

  const hasActiveIncidentFilter =
    incidentStatusFilter !== 'ALL' ||
    incidentTimeFilter !== 'ALL' ||
    Boolean(incidentSearchQuery.trim()) ||
    Boolean(incidentCustomDate);

  const resetIncidentFilters = () => {
    setIncidentStatusFilter('ALL');
    setIncidentTimeFilter('ALL');
    setIncidentCustomDate('');
    setIncidentSearchQuery('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Portal Quản Trị Thư Viện Thông Minh</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Bảng điều khiển dành riêng cho Quản trị viên (QTV)</p>
        </div>


      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-sm font-semibold">Đang tải dữ liệu Portal...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-200 flex flex-col items-center text-center">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="font-bold">{error}</p>
          <button
            onClick={() => fetchData(true)}
            className="mt-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-100"
          >
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'OVERVIEW' && (
            <div key="OVERVIEW" className="space-y-6 animate-fade-in">
              {/* Bộ lọc ngày xem thống kê */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-wrap">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Thời Gian Phân Tích Dữ Liệu</h3>
                  <p className="text-xs text-slate-500">
                    Thống kê tỷ lệ lấp đầy các tầng và mật độ sử dụng phòng theo ngày được chọn
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <label htmlFor="admin-analytics-date" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
                    Chọn ngày:
                  </label>
                  <input
                    id="admin-analytics-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="datetime-input text-xs"
                  />
                </div>
              </div>

              <AdminKPICards
                totalRooms={kpiSummary.totalRooms}
                maintenanceRooms={kpiSummary.maintenanceRooms}
                activeBookings={kpiSummary.activeBookingsToday}
                pendingApprovals={kpiSummary.pendingApprovals}
                openIncidents={kpiSummary.openIncidents}
                utilizationRate={kpiSummary.currentUtilizationRate}
                selectedDate={selectedDate}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FloorUtilizationChart
                  data={floorUtilizationData}
                  selectedDate={selectedDate}
                />
                <HourlyBookingsChart
                  hours={hourlyBookingsData.hours}
                  peakHour={hourlyBookingsData.peakHour}
                  peakCount={hourlyBookingsData.peakCount}
                  maxCount={hourlyBookingsData.maxCount}
                  selectedDate={selectedDate}
                />
              </div>

              <MonthlyStudentDensityChart
                data={monthlyStudentDensityData}
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
              />

              <RoomUtilizationTable
                items={roomUtilizationData}
                selectedDate={selectedDate}
                isLoading={isLoading}
              />
            </div>
          )}

          {activeTab === 'ROOMS' && (
            <div key="ROOMS" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Quản Lý Trạng Thái Bảo Trì Phòng</h3>
                  <p className="text-xs text-slate-500">
                    Bật chế độ bảo trì hoặc mở trống cho các phòng trong Thư Viện Thông Minh.
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={roomSearchTerm}
                    onChange={(e) => setRoomSearchTerm(e.target.value)}
                    placeholder="Tìm theo mã phòng (VD: L.103)..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  Không tìm thấy phòng nào khớp với từ khóa tìm kiếm.
                </div>
              ) : (
                <div className="space-y-6">
                  {floorNumbers.map((floorNum) => {
                    const floorRooms = filteredRooms.filter((r) => r.floor === floorNum);
                    if (floorRooms.length === 0) return null;

                    const floorName =
                      floorNum === 0
                        ? 'Tầng G - Sảnh Đọc & Phòng tự học'
                        : `Tầng ${floorNum} - ${floorRooms[0]?.roomType || 'Phòng học'}`;

                    return (
                      <div key={floorNum} className="space-y-3">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                          <span className="text-xs font-black px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                            {floorRooms[0]?.floorCode || `Tầng ${floorNum}`}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{floorName}</span>
                          <span className="text-xs text-slate-400">({floorRooms.length} phòng)</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {floorRooms.map((r) => {
                            const isMaint = r.maintenance || r.status === 'MAINTENANCE';
                            const isUpdating = loadingRoomId === r.id;

                            return (
                              <div
                                key={r.id}
                                className={`p-4 rounded-xl border transition-all space-y-3 ${
                                  isMaint
                                    ? 'bg-amber-50/60 border-amber-200'
                                    : 'bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div
                                  className={`flex justify-between items-start gap-2 min-w-0 ${
                                    isMaint ? 'cursor-pointer hover:opacity-90' : ''
                                  }`}
                                  {...(isMaint
                                    ? {
                                        role: 'button',
                                        tabIndex: 0,
                                        'aria-label': `Xem lý do bảo trì phòng ${r.roomCode}`,
                                        onClick: () => setViewMaintenanceModal(r),
                                        onKeyDown: (e: React.KeyboardEvent) => {
                                          if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setViewMaintenanceModal(r);
                                          }
                                        },
                                      }
                                    : {})}
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                      <h4 className="font-bold text-slate-900">Phòng {r.roomCode}</h4>
                                      {r.requiresApproval && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                                          Cần duyệt
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                      {r.roomType} • Sức chứa {r.capacity} người
                                    </p>
                                    {isMaint && (
                                      <p
                                        className="text-[10px] text-amber-700 font-medium mt-1 truncate"
                                        title={r.maintenanceReason || 'Chưa ghi lý do'}
                                      >
                                        Lý do: <span className="font-bold">{r.maintenanceReason || 'Chưa ghi lý do'}</span>
                                      </p>
                                    )}
                                  </div>
                                  <StatusBadge status={isMaint ? 'MAINTENANCE' : r.status} />
                                </div>

                                <div className="flex flex-wrap gap-2 pt-1">
                                  <button
                                    type="button"
                                    disabled={!isMaint || isUpdating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      executeUpdateRoomStatus(r, 'AVAILABLE');
                                    }}
                                    className={`flex-1 min-h-[44px] py-1.5 px-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                      !isMaint || isUpdating
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                                    }`}
                                  >
                                    {isUpdating && isMaint && (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    )}
                                    <span>Mở Trống</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isMaint || isUpdating}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenMaintenanceModal(r);
                                    }}
                                    className={`flex-1 min-h-[44px] py-1.5 px-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                      isMaint || isUpdating
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        : 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm'
                                    }`}
                                  >
                                    {isUpdating && !isMaint && (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    )}
                                    <span>Bảo Trì</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'REGISTRATIONS' && (
            <div key="REGISTRATIONS" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Duyệt Đơn Đặt Phòng Hội Nghị</h3>
                  <p className="text-xs text-slate-500">
                    Phòng hội nghị (L.106, L.506) yêu cầu phê duyệt từ Quản trị viên trước khi cấp mã QR và cho phép check-in.
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 self-start sm:self-auto">
                  {pendingBookings.length} đơn chờ duyệt
                </span>
              </div>

              {pendingBookings.length === 0 ? (
                <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 flex flex-col items-center text-center text-slate-500">
                  <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-500" />
                  <p className="font-bold text-slate-700">Không có đơn chờ duyệt</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Tất cả các yêu cầu đặt phòng hội nghị đã được xử lý.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingBookings.map((b) => {
                    const isActing = loadingApprovalId === b.id;
                    return (
                      <div
                        key={b.id}
                        className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white transition-all space-y-4 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 flex-wrap min-w-0">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-mono font-bold text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                              {b.id}
                            </span>
                            <span className="font-bold text-slate-900 text-sm min-w-0 break-words">
                              Phòng {b.roomCode} ({b.roomType}) - {b.floorCode}
                            </span>
                          </div>
                          <StatusBadge status={b.status} />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-white p-3.5 rounded-xl border border-slate-100">
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 font-semibold block">Sinh viên đặt:</span>
                            <span className="font-bold text-slate-900 block break-words">{b.studentName}</span>
                            <span className="text-[11px] text-blue-600 font-mono break-all">MSSV: {b.studentCode}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 font-semibold block">Thời gian:</span>
                            <span className="font-bold text-slate-800 block">{b.date}</span>
                            <span className="text-[11px] text-slate-600 font-mono">{b.startTime} - {b.endTime}</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 font-semibold block">Số lượng đăng ký:</span>
                            <span className="font-bold text-slate-800">{b.numberOfPeople} người</span>
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] text-slate-400 font-semibold block">Thời điểm gửi:</span>
                            <span className="text-[11px] text-slate-500 font-mono">{b.createdAt}</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 break-words">
                          <span className="font-bold text-slate-800">Mục đích sử dụng:</span> {b.purpose}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleOpenRejectModal(b)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50 min-h-[44px]"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Từ chối</span>
                          </button>
                          <button
                            type="button"
                            disabled={isActing}
                            onClick={() => handleApproveBooking(b)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-colors disabled:opacity-50 min-h-[44px]"
                          >
                            {isActing ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Chấp nhận</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'BOOKINGS' && (
            <AdminBookingTable
              bookings={bookings}
              onNavigateToApproval={() => navigate('/admin?tab=REGISTRATIONS')}
              onRefresh={() => fetchData(false)}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'INCIDENTS' && (
            <div key="INCIDENTS" className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Xử Lý Phản Ánh Sự Cố</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Theo dõi và xử lý các phản ánh sự cố kỹ thuật tại các phòng
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      type="button"
                      onClick={() => fetchData(false)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 shadow-xs active:scale-95 transition-all disabled:opacity-50"
                      title="Làm mới danh sách sự cố"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Làm mới</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreateIncidentModalOpen(true)}
                      className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
                    >
                      <Plus className="w-4 h-4" /> Báo sự cố mới
                    </button>
                  </div>
                </div>

                {/* BỘ LỌC TRẠNG THÁI (STATUS TABS) */}
                <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                  <button
                    type="button"
                    onClick={() => setIncidentStatusFilter('ALL')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      incidentStatusFilter === 'ALL'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                    }`}
                  >
                    <span>Tất cả sự cố</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        incidentStatusFilter === 'ALL' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {incidentStats.total}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncidentStatusFilter('OPEN')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      incidentStatusFilter === 'OPEN'
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/20'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    <span>Chưa xử lý</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        incidentStatusFilter === 'OPEN' ? 'bg-rose-700 text-white' : 'bg-rose-200/80 text-rose-800'
                      }`}
                    >
                      {incidentStats.open}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncidentStatusFilter('RESOLVED')}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      incidentStatusFilter === 'RESOLVED'
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200'
                    }`}
                  >
                    <span>Đã xử lý</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                        incidentStatusFilter === 'RESOLVED'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-200/80 text-emerald-800'
                      }`}
                    >
                      {incidentStats.resolved}
                    </span>
                  </button>
                </div>

                {/* BỘ LỌC TÌM KIẾM VÀ THỜI GIAN */}
                <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Ô TÌM KIẾM */}
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={incidentSearchQuery}
                        onChange={(e) => setIncidentSearchQuery(e.target.value)}
                        placeholder="Tìm theo phòng (L.103), thiết bị, người báo, MSSV, mô tả..."
                        className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      {incidentSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setIncidentSearchQuery('')}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                          title="Xóa tìm kiếm"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* BỘ LỌC THỜI GIAN NHANH */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mr-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Thời gian:
                      </span>

                      {(
                        [
                          { id: 'ALL', label: 'Tất cả' },
                          { id: 'TODAY', label: 'Hôm nay' },
                          { id: 'WEEK', label: '7 ngày qua' },
                          { id: 'MONTH', label: '30 ngày qua' },
                          { id: 'CUSTOM', label: 'Theo ngày' },
                        ] as const
                      ).map((tf) => (
                        <button
                          key={tf.id}
                          type="button"
                          onClick={() => {
                            setIncidentTimeFilter(tf.id);
                            if (tf.id !== 'CUSTOM') setIncidentCustomDate('');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            incidentTimeFilter === tf.id
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}

                      {/* DATE PICKER KHI CHỌN THEO NGÀY */}
                      {incidentTimeFilter === 'CUSTOM' && (
                        <input
                          type="date"
                          value={incidentCustomDate}
                          onChange={(e) => setIncidentCustomDate(e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}

                      {/* NÚT ĐẶT LẠI NẾU CÓ BỘ LỌC HOẠT ĐỘNG */}
                      {hasActiveIncidentFilter && (
                        <button
                          type="button"
                          onClick={resetIncidentFilters}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors ml-auto lg:ml-1"
                          title="Xóa tất cả bộ lọc"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Đặt lại</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {hasActiveIncidentFilter && (
                    <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>
                        Hiển thị <strong>{filteredIncidents.length}</strong> trên tổng số{' '}
                        <strong>{incidents.length}</strong> sự cố
                      </span>
                    </div>
                  )}
                </div>

                {/* DANH SÁCH SỰ CỐ */}
                <div className="space-y-3">
                  {incidents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Chưa có sự cố nào được ghi nhận.
                    </div>
                  ) : filteredIncidents.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-400" />
                      <p className="text-sm font-bold text-slate-700">Không tìm thấy sự cố nào phù hợp với bộ lọc.</p>
                      <p className="text-xs text-slate-500">
                        Thử thay đổi từ khóa tìm kiếm hoặc đặt lại khoảng thời gian.
                      </p>
                      <button
                        type="button"
                        onClick={resetIncidentFilters}
                        className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 shadow-xs"
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  ) : (
                    filteredIncidents.map((inc) => {
                      const formattedTime = formatIncidentDateTime(inc.createdAt);
                      const resolvedImageUrl = resolveIncidentImageUrl(inc.imageUrl);
                      const reporterDisplay = inc.reporterCode
                        ? `${inc.reporterName} (${inc.reporterCode})`
                        : inc.reporterName || 'N/A';

                      return (
                        <div
                          key={inc.id}
                          className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm"
                        >
                          {/* ẢNH ĐÍNH KÈM (nếu có): thu nhỏ 80x80, object-cover, loading="lazy", alt có mô tả */}
                          {resolvedImageUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedIncidentImage({
                                  url: resolvedImageUrl,
                                  title: `Ảnh sự cố: Phòng ${inc.roomCode || inc.roomId} - ${inc.deviceName || 'Thiết bị'}`,
                                })
                              }
                              className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-blue-400 group shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm relative bg-slate-50"
                              title="Bấm để xem ảnh lớn"
                              aria-label={`Xem ảnh lớn sự cố: ${inc.description}`}
                            >
                              <img
                                src={resolvedImageUrl}
                                alt={`Ảnh minh họa sự cố: ${inc.description}`}
                                loading="lazy"
                                className="w-20 h-20 object-cover group-hover:scale-105 transition-transform"
                                onError={(e) => {
                                  const btn = e.currentTarget.closest('button');
                                  if (btn) {
                                    btn.style.display = 'none';
                                  } else {
                                    e.currentTarget.style.display = 'none';
                                  }
                                }}
                              />
                            </button>
                          )}

                          {/* Thông tin sự cố */}
                          <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm sm:text-base">
                                Phòng {inc.roomCode || inc.roomId} • {inc.deviceName || 'Thiết bị'}
                              </span>
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                  inc.status === 'OPEN'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {inc.status === 'OPEN' ? 'Chưa xử lý' : 'Đã sửa xong'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 break-words">{inc.description}</p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span>
                                Người báo: <strong className="text-slate-700 font-semibold">{reporterDisplay}</strong>
                              </span>
                              {formattedTime && (
                                <span>
                                  Thời gian: <span className="font-mono">{formattedTime}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Hành động */}
                          <div className="self-end sm:self-auto shrink-0">
                            {inc.status === 'OPEN' ? (
                              <button
                                onClick={() => handleResolveIncident(inc.id)}
                                className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-500/20 active:scale-95 transition-all min-h-[44px]"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Đã Sửa Xong
                              </button>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 px-3 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đã Xử Lý
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'VIOLATIONS' && (
            <div key="VIOLATIONS" className="space-y-6 animate-fade-in">
              <AdminViolations />
            </div>
          )}
        </>
      )}

      {/* Modal chuyển phòng sang bảo trì (bắt buộc nhập lý do) */}
      {maintenanceModal && (
        <Modal
          isOpen={!!maintenanceModal}
          onClose={() => {
            if (loadingRoomId !== maintenanceModal.room.id) {
              setMaintenanceModal(null);
            }
          }}
          title={`Chuyển phòng ${maintenanceModal.room.roomCode} sang bảo trì`}
          subtitle={`${maintenanceModal.room.roomType} • ${maintenanceModal.room.floorCode}`}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={loadingRoomId === maintenanceModal.room.id}
                onClick={() => setMaintenanceModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px]"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={
                  maintenanceReason.trim().length < 5 ||
                  maintenanceReason.trim().length > 300 ||
                  loadingRoomId === maintenanceModal.room.id
                }
                onClick={() => {
                  const trimmed = maintenanceReason.trim();
                  if (trimmed.length < 5) {
                    setMaintenanceReasonError('Lý do bảo trì phải có tối thiểu 5 ký tự');
                    return;
                  }
                  if (trimmed.length > 300) {
                    setMaintenanceReasonError('Lý do bảo trì không được vượt quá 300 ký tự');
                    return;
                  }
                  executeUpdateRoomStatus(maintenanceModal.room, 'MAINTENANCE', trimmed);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-amber-500/20 transition-colors flex items-center gap-1.5 min-h-[44px]"
              >
                {loadingRoomId === maintenanceModal.room.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Xác nhận Bảo trì</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            {maintenanceModal.upcomingCount > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{maintenanceModal.upcomingCount} lượt đặt sẽ bị hủy</span>
                </div>
                <p className="text-[11px] text-rose-600 leading-relaxed">
                  Khi kích hoạt bảo trì, hệ thống sẽ tự động hủy các lượt đặt phòng sắp tới và gửi thông báo lý do bảo trì cho sinh viên.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="maintenance-reason-input" className="block text-xs font-bold text-slate-700 mb-1">
                Lý do bảo trì <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="maintenance-reason-input"
                value={maintenanceReason}
                onChange={(e) => {
                  const val = e.target.value;
                  setMaintenanceReason(val);
                  if (val.trim().length >= 5 && val.trim().length <= 300) {
                    setMaintenanceReasonError(null);
                  } else if (val.trim().length > 300) {
                    setMaintenanceReasonError('Lý do bảo trì không được vượt quá 300 ký tự');
                  } else if (val.trim().length > 0 && val.trim().length < 5) {
                    setMaintenanceReasonError('Lý do bảo trì phải có tối thiểu 5 ký tự');
                  }
                }}
                placeholder="Nhập chi tiết nguyên nhân phòng cần bảo trì (tối thiểu 5 ký tự, tối đa 300 ký tự)..."
                rows={3}
                maxLength={300}
                className={`w-full p-3 rounded-xl border text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all ${
                  maintenanceReasonError ? 'border-rose-300 bg-rose-50/20' : 'border-slate-200'
                }`}
              />
              <div className="flex justify-between items-center text-[11px] mt-1">
                <span className="text-rose-600 font-semibold">{maintenanceReasonError}</span>
                <span className="text-slate-400">{maintenanceReason.length}/300 ký tự</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal xem lý do bảo trì của phòng đang bảo trì */}
      {viewMaintenanceModal && (
        <Modal
          isOpen={!!viewMaintenanceModal}
          onClose={() => {
            if (loadingRoomId !== viewMaintenanceModal.id) {
              setViewMaintenanceModal(null);
            }
          }}
          title={`Thông tin bảo trì phòng ${viewMaintenanceModal.roomCode}`}
          subtitle={`${viewMaintenanceModal.roomType} • ${viewMaintenanceModal.floorCode}`}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={loadingRoomId === viewMaintenanceModal.id}
                onClick={() => setViewMaintenanceModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px]"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={loadingRoomId === viewMaintenanceModal.id}
                onClick={() => executeUpdateRoomStatus(viewMaintenanceModal, 'AVAILABLE')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-colors min-h-[44px]"
              >
                {loadingRoomId === viewMaintenanceModal.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Mở trống</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Trạng thái: Đang bảo trì</span>
              </div>
              <div className="pt-1 border-t border-amber-200/60">
                <span className="text-slate-500 block text-[11px] mb-0.5">Lý do bảo trì:</span>
                <p className="font-semibold text-slate-900 whitespace-pre-wrap text-sm">
                  {viewMaintenanceModal.maintenanceReason?.trim() || 'Chưa ghi lý do'}
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal từ chối đơn đặt phòng có bắt buộc nhập lý do */}
      {rejectBookingModal && (
        <Modal
          isOpen={!!rejectBookingModal}
          onClose={() => setRejectBookingModal(null)}
          title="Từ Chối Đơn Đặt Phòng"
          subtitle={`${rejectBookingModal.id} • Phòng ${rejectBookingModal.roomCode}`}
          footer={
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectBookingModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={loadingApprovalId === rejectBookingModal.id}
                onClick={handleConfirmReject}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/20 transition-colors disabled:opacity-50 min-h-[44px]"
              >
                {loadingApprovalId === rejectBookingModal.id && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Xác nhận Từ chối</span>
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn đang từ chối đơn đặt phòng của sinh viên{' '}
              <span className="font-bold text-slate-900">{rejectBookingModal.studentName}</span> (MSSV:{' '}
              {rejectBookingModal.studentCode}). Khung giờ sẽ được giải phóng ngay sau khi từ chối.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do từ chối <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value);
                  if (rejectError) setRejectError(null);
                }}
                placeholder="VD: Phòng hội nghị trùng lịch sự kiện của nhà trường / Không đủ số lượng người tham gia tối thiểu..."
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              {rejectError && (
                <p className="text-rose-600 text-[11px] font-bold mt-1">{rejectError}</p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Báo sự cố mới cho admin */}
      {isCreateIncidentModalOpen && (
        <Modal
          isOpen={isCreateIncidentModalOpen}
          onClose={() => setIsCreateIncidentModalOpen(false)}
          title="Báo sự cố thiết bị mới"
          subtitle="Tạo báo cáo sự cố kỹ thuật trực tiếp từ ban quản lý"
        >
          <IncidentReportForm
            onSuccess={() => {
              setIsCreateIncidentModalOpen(false);
              setToastMessage('Báo sự cố mới thành công!');
              setToastType('success');
              fetchData(false);
            }}
            onCancel={() => setIsCreateIncidentModalOpen(false)}
            submitLabel="Báo Sự Cố"
          />
        </Modal>
      )}

      {/* Modal xem ảnh lớn sự cố */}
      {selectedIncidentImage && (
        <Modal
          isOpen={!!selectedIncidentImage}
          onClose={() => setSelectedIncidentImage(null)}
          title={selectedIncidentImage.title}
        >
          <div className="flex flex-col items-center justify-center p-2">
            <img
              src={selectedIncidentImage.url}
              alt={selectedIncidentImage.title}
              className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.modal-img-fallback')) {
                  const msg = document.createElement('div');
                  msg.className = 'modal-img-fallback py-10 px-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200 w-full';
                  msg.textContent = 'Không thể tải tệp ảnh này (ảnh cũ có thể không còn tồn tại trên máy chủ).';
                  parent.appendChild(msg);
                }
              }}
            />
          </div>
        </Modal>
      )}

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
