import React, { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { QRModal } from '../../components/booking/QRModal';
import { Toast } from '../../components/ui/Toast';
import { Booking } from '../../types/booking';
import { Calendar, Clock, QrCode, MapPin, LogOut, Loader2, AlertCircle } from 'lucide-react';
import { checkoutApi } from '../../api/checkinApi';
import { getMyBookingsApi } from '../../api/bookingApi';
import { getErrorMessage } from '../../api/errorMessages';

// Component đếm ngược
const CheckinCountdown: React.FC<{ bookingDate: string, startTime: string }> = ({ bookingDate, startTime }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      // Assume bookingDate is YYYY-MM-DD and startTime is HH:mm
      const [year, month, day] = bookingDate.split('-').map(Number);
      const [hours, minutes] = startTime.split(':').map(Number);
      const targetTime = new Date(year, month - 1, day, hours, minutes);
      
      const diffMs = targetTime.getTime() - now.getTime();
      
      if (diffMs <= 0) {
        // Đã đến giờ
        setTimeLeft('Đã đến giờ check-in');
        return;
      }
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      let text = '';
      if (diffDays > 0) text += `${diffDays} ngày `;
      if (diffHours > 0 || diffDays > 0) text += `${diffHours} giờ `;
      text += `${diffMins} phút`;
      
      setTimeLeft(text);
    };
    
    updateCountdown();
    const timer = setInterval(updateCountdown, 60000); // Cập nhật mỗi phút
    
    return () => clearInterval(timer);
  }, [bookingDate, startTime]);
  
  return (
    <div className="text-[11px] font-bold text-amber-600 bg-amber-50 py-1.5 px-3 rounded-lg border border-amber-200 mt-2 flex items-center justify-center">
      ⏳ Còn lại: {timeLeft}
    </div>
  );
};

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMyBookingsApi();
      if (res.success && res.data) {
        setBookings(res.data);
      } else {
        setError(getErrorMessage(res));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
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
        // Refresh after checkout
        fetchBookings();
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Lịch Đặt Phòng Của Tôi</h1>
        <p className="text-xs text-slate-500 font-medium">Theo dõi danh sách các phòng học nhóm bạn đã đặt thành công</p>
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
          <button onClick={fetchBookings} className="mt-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-100">
            Thử lại
          </button>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 flex flex-col items-center text-center text-slate-500">
          <Calendar className="w-12 h-12 mb-4 text-slate-300" />
          <p className="font-bold text-slate-600">Bạn chưa có lịch đặt phòng nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:shadow-md transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                    {b.id}
                  </span>
                  <StatusBadge status={b.status} />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">Phòng {b.roomCode}</h3>
                  <p className="text-xs text-slate-500 font-medium">{b.building} - Tầng {b.floor}</p>
                </div>

                <div className="space-y-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl mt-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Ngày: <strong>{b.date}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>Khung giờ: <strong>{b.startTime} - {b.endTime}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>Sức chứa đăng ký: <strong>{b.numberOfPeople} người</strong></span>
                  </div>
                </div>
                
                {b.status === 'CONFIRMED' && (
                  <CheckinCountdown bookingDate={b.date} startTime={b.startTime} />
                )}
              </div>

              <div className="mt-4 flex gap-2">
                {b.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleShowQR(b)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4 text-blue-400" />
                    <span>Xem Mã QR</span>
                  </button>
                )}
                {b.status === 'IN_USE' && (
                  <button
                    onClick={() => handleCheckout(b.id)}
                    disabled={loadingCheckout === b.id}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{loadingCheckout === b.id ? 'Đang xử lý...' : 'Trả phòng'}</span>
                  </button>
                )}
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
