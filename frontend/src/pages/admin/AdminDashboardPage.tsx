import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminKPICards } from '../../components/admin/AdminKPICards';
import { FloorUtilizationChart } from '../../components/admin/FloorUtilizationChart';
import { HourlyBookingsChart } from '../../components/admin/HourlyBookingsChart';
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
  calculateRoomUtilization,
} from '../../utils/adminAnalytics';

const VALID_TABS = ['OVERVIEW', 'ROOMS', 'REGISTRATIONS', 'BOOKINGS', 'INCIDENTS'] as const;
type AdminTab = typeof VALID_TABS[number];

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
      // Tải dữ liệu dashboard
      const dashRes = await getAdminDashboardDataApi();
      if (dashRes.success) {
        setBookings(dashRes.data.bookings || []);
        setIncidents(dashRes.data.incidents || []);
      } else {
        throw new Error(getErrorMessage(dashRes));
      }

      // Tải danh sách phòng (kèm phòng bảo trì cho admin)
      const roomsRes = await getRoomsApi({ includeMaintenance: true });
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

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 pb-28 lg:pb-8 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Portal Quản Trị Thư Viện Tòa L</h1>
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
            <div className="space-y-6">
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

              <RoomUtilizationTable
                items={roomUtilizationData}
                selectedDate={selectedDate}
                isLoading={isLoading}
              />
            </div>
          )}

          {activeTab === 'ROOMS' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Quản Lý Trạng Thái Bảo Trì Phòng</h3>
                  <p className="text-xs text-slate-500">
                    Bật chế độ bảo trì hoặc mở trống cho các phòng trong thư viện tòa L.
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
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
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
            />
          )}

          {activeTab === 'INCIDENTS' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Xử Lý Phản Ánh Sự Cố</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Theo dõi và xử lý các phản ánh sự cố kỹ thuật tại các phòng
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateIncidentModalOpen(true)}
                    className="inline-flex items-center gap-1.5 py-2 px-3.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-500/20 active:scale-95 transition-all self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" /> Báo sự cố mới
                  </button>
                </div>

                <div className="space-y-3">
                  {incidents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Chưa có sự cố nào được ghi nhận.
                    </div>
                  ) : (
                    incidents.map((inc) => {
                      const formattedTime = formatIncidentDateTime(inc.createdAt);
                      const reporterDisplay = inc.reporterCode
                        ? `${inc.reporterName} (${inc.reporterCode})`
                        : inc.reporterName || 'N/A';

                      return (
                        <div
                          key={inc.id}
                          className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm"
                        >
                          {/* ẢNH ĐÍNH KÈM (nếu có): thu nhỏ 80x80, object-cover, loading="lazy", alt có mô tả */}
                          {inc.imageUrl && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedIncidentImage({
                                  url: inc.imageUrl,
                                  title: `Ảnh sự cố: Phòng ${inc.roomCode || inc.roomId} - ${inc.deviceName || 'Thiết bị'}`,
                                })
                              }
                              className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 hover:border-blue-400 group shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                              title="Bấm để xem ảnh lớn"
                              aria-label={`Xem ảnh lớn sự cố: ${inc.description}`}
                            >
                              <img
                                src={inc.imageUrl}
                                alt={`Ảnh minh họa sự cố: ${inc.description}`}
                                loading="lazy"
                                className="w-20 h-20 object-cover group-hover:scale-105 transition-transform"
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
          <div className="flex justify-center p-2">
            <img
              src={selectedIncidentImage.url}
              alt={selectedIncidentImage.title}
              className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-sm"
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
