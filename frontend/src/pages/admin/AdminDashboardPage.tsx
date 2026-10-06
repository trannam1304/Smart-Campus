import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useBooking } from '../../context/BookingContext';
import { AdminKPICards } from '../../components/admin/AdminKPICards';
import { FloorUtilizationChart } from '../../components/admin/FloorUtilizationChart';
import { HourlyBookingsChart } from '../../components/admin/HourlyBookingsChart';
import { AdminBookingTable } from '../../components/admin/AdminBookingTable';
import { AdminViolations } from '../../components/admin/AdminViolations';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Toast } from '../../components/ui/Toast';
import { ShieldCheck, Check, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import {
  getAdminDashboardDataApi,
  updateRoomStatusApi,
  resolveIncidentApi,
  handleRegistrationApi
} from '../../api/adminApi';
import { getRoomsApi } from '../../api/roomApi';
import { getErrorMessage } from '../../api/errorMessages';
import { Booking, RegistrationRequest, Room } from '../../types/booking';

export const AdminDashboardPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = (queryParams.get('tab') as any) || 'OVERVIEW';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ROOMS' | 'REGISTRATIONS' | 'BOOKINGS' | 'INCIDENTS'>(initialTab);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRequest[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Tải dữ liệu dashboard
      const dashRes = await getAdminDashboardDataApi();
      if (dashRes.success) {
        setBookings(dashRes.data.bookings || []);
        setIncidents(dashRes.data.incidents || []);
        setRegistrations(dashRes.data.registrations || []);
      } else {
        throw new Error(getErrorMessage(dashRes));
      }
      
      // Tải danh sách phòng
      const roomsRes = await getRoomsApi({ });
      if (roomsRes.success && roomsRes.data) {
        setAllRooms(roomsRes.data.items);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const tabParam = queryParams.get('tab') as any;
    if (tabParam) setActiveTab(tabParam);
  }, [location.search]);

  const handleUpdateRoomStatus = async (roomId: string, status: string) => {
    try {
      const res = await updateRoomStatusApi(roomId, status);
      if (res.success) {
        setToastType('success');
        setToastMessage(res.message);
        fetchData();
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const res = await resolveIncidentApi(incidentId);
      if (res.success) {
        setToastType('success');
        setToastMessage(res.message);
        fetchData();
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    }
  };

  const handleRegistration = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await handleRegistrationApi(id, status);
      if (res.success) {
        setToastType('success');
        setToastMessage(res.message);
        fetchData();
      } else {
        setToastType('error');
        setToastMessage(getErrorMessage(res));
      }
    } catch (err) {
      setToastType('error');
      setToastMessage(getErrorMessage(err));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-black text-slate-900">Portal Quản Trị Thư Viện Tòa L</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">Bảng điều khiển dành riêng cho Quản trị viên (QTV)</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Analytic Thống Kê' },
          { id: 'ROOMS', label: 'Quản lý phòng' },
          { id: 'REGISTRATIONS', label: 'Duyệt đơn đăng ký' },
          { id: 'BOOKINGS', label: 'Danh sách lịch đặt' },
          { id: 'INCIDENTS', label: 'Xử lý sự cố & Vi phạm' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
          <button onClick={fetchData} className="mt-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-100">
            Thử lại
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              <AdminKPICards
                totalRooms={allRooms.length}
                activeBookings={bookings.length}
                openIncidents={incidents.filter(i => i.status === 'OPEN').length}
                utilizationRate={75}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FloorUtilizationChart />
                <HourlyBookingsChart />
              </div>
            </div>
          )}

          {activeTab === 'ROOMS' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Quản Lý Trạng Thái Bảo Trì Phòng</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allRooms.map((r) => (
                  <div key={r.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-900">Phòng {r.roomCode} ({r.floorCode})</h4>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateRoomStatus(r.id, 'AVAILABLE')}
                        className="flex-1 py-1.5 px-2 bg-emerald-600 text-white text-[11px] font-bold rounded-lg hover:bg-emerald-700"
                      >
                        Mở Trống
                      </button>
                      <button
                        onClick={() => handleUpdateRoomStatus(r.id, 'MAINTENANCE')}
                        className="flex-1 py-1.5 px-2 bg-amber-600 text-white text-[11px] font-bold rounded-lg hover:bg-amber-700"
                      >
                        Bảo Trì
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'REGISTRATIONS' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Danh Sách Đơn Đăng Ký Chờ Duyệt</h3>

              <div className="space-y-3">
                {registrations.map((reg) => (
                  <div key={reg.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{reg.fullName}</span>
                        <span className="text-xs font-mono text-blue-600">({reg.studentCode})</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">Email: {reg.email} - {reg.faculty}</p>
                      <span className="text-[10px] text-slate-400">Thời gian tạo: {reg.createdAt}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {reg.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => handleRegistration(reg.id, 'APPROVED')}
                            className="inline-flex items-center gap-1 py-1.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" /> Chấp nhận
                          </button>
                          <button
                            onClick={() => handleRegistration(reg.id, 'REJECTED')}
                            className="inline-flex items-center gap-1 py-1.5 px-3 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700"
                          >
                            <X className="w-3.5 h-3.5" /> Từ chối
                          </button>
                        </>
                      ) : reg.status === 'APPROVED' ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                          Đã Chấp Nhận
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                          Đã Từ Chối
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'BOOKINGS' && (
            <AdminBookingTable bookings={bookings} />
          )}

          {activeTab === 'INCIDENTS' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-900">Xử Lý Phản Ánh Sự Cố</h3>
                <div className="space-y-3">
                  {incidents.map((inc) => (
                    <div key={inc.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">Phòng {inc.roomCode || inc.roomId} - {inc.deviceName || 'Thiết bị'}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{inc.description}</p>
                      </div>
                      {inc.status === 'OPEN' ? (
                        <button
                          onClick={() => handleResolveIncident(inc.id)}
                          className="inline-flex items-center gap-1 py-1.5 px-3 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã Sửa Xong
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600">Đã Xử Lý</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <AdminViolations />
            </div>
          )}
        </>
      )}

      {toastMessage && (
        <Toast message={toastMessage} type={toastType} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
