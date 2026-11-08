import React from 'react';
import { Modal } from '../ui/Modal';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, User } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { Booking, BookingMember } from '../../types/booking';
import { CreateBookingResponse } from '../../api/bookingApi';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | CreateBookingResponse | any;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, booking }) => {
  const { user } = useAuth();

  if (!booking) return null;

  const currentStudentCode = user?.studentCode;

  // Xác định mã QR, tên và MSSV của người dùng hiện tại
  let isMember = false;
  let qrCodeData = '';
  let memberName = '';
  let memberCode = '';

  if (Array.isArray(booking.members) && booking.members.length > 0) {
    const foundMember = booking.members.find(
      (m: BookingMember) => currentStudentCode && m.studentCode === currentStudentCode
    );
    if (foundMember) {
      isMember = true;
      qrCodeData = foundMember.qrCode;
      memberName = foundMember.studentName;
      memberCode = foundMember.studentCode;
    } else {
      isMember = false;
    }
  } else if (Array.isArray(booking.memberQrCodes) && booking.memberQrCodes.length > 0) {
    const foundMemberQr = booking.memberQrCodes.find(
      (m: { studentCode: string; qrCodeData: string }) =>
        currentStudentCode && m.studentCode === currentStudentCode
    );
    if (foundMemberQr) {
      isMember = true;
      qrCodeData = foundMemberQr.qrCodeData;
      memberName = user?.fullName || 'Sinh viên';
      memberCode = currentStudentCode || '';
    } else {
      isMember = false;
    }
  } else {
    // Trường hợp không có danh sách members/memberQrCodes (fallback kiểm tra studentCode)
    if (booking.studentCode && currentStudentCode && booking.studentCode !== currentStudentCode) {
      isMember = false;
    } else {
      isMember = true;
      qrCodeData = booking.qrCodeData || booking.qrCode || '';
      memberName = booking.studentName || user?.fullName || 'Sinh viên';
      memberCode = currentStudentCode || booking.studentCode || '';
    }
  }

  // Khung giờ cho phép check-in
  const allowEarlyFrom = booking.checkInWindow?.allowEarlyFrom || booking.startTime;
  const deadlineAt = booking.checkInWindow?.deadlineAt || booking.endTime;
  const roomCode = booking.roomCode;

  // Chỉ dùng thẻ img nếu API thật trả về data URL hợp lệ bắt đầu bằng 'data:image/'
  const hasValidDataUrlImage =
    typeof booking.qrCodeImageBase64 === 'string' &&
    booking.qrCodeImageBase64.startsWith('data:image/');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mã QR Check-in Điểm Danh"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
        >
          Đóng cửa sổ
        </button>
      }
    >
      {!isMember ? (
        <div className="py-6 px-4 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-rose-700">
            Bạn không có trong danh sách thành viên của lượt đặt này
          </p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Chỉ những thành viên được đăng ký trong danh sách lượt đặt phòng mới được cấp mã QR điểm danh cá nhân.
          </p>
        </div>
      ) : (
        <div className="text-center space-y-4">
          {/* Thông tin sinh viên quét mã */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-semibold text-blue-700">
              <User className="w-4 h-4 shrink-0" />
              <span>Thành viên:</span>
            </div>
            <span className="font-bold">
              {memberName} {memberCode ? `(${memberCode})` : ''}
            </span>
          </div>

          {/* QR Code */}
          <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-inner">
            <div className="w-48 h-48 bg-white rounded-xl p-1 flex flex-col justify-center items-center relative overflow-hidden group">
              {hasValidDataUrlImage ? (
                <img
                  src={booking.qrCodeImageBase64}
                  alt="QR Code"
                  className="w-full h-full object-contain bg-white rounded-lg"
                />
              ) : (
                <QRCodeSVG value={qrCodeData} size={184} className="w-full h-full" />
              )}
            </div>
            <div className="mt-3">
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Mã dự phòng (Nhập tay)
              </span>
              <span className="block font-mono text-[11px] font-black text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 select-all">
                {qrCodeData}
              </span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-xs font-medium text-slate-700 border border-slate-100">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>
                Phòng: <strong className="text-slate-900">{roomCode}</strong>
              </span>
            </div>
            {booking.date && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>
                  Ngày: <strong>{booking.date}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Khung giờ cho phép quét QR:</span>
            </div>
            <div className="pl-6 text-[11px] space-y-1 font-semibold text-slate-600 bg-white p-2 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center">
                <span>Bắt đầu từ:</span>
                <span className="text-emerald-600 font-bold">{allowEarlyFrom}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Hết hạn lúc:</span>
                <span className="text-rose-600 font-bold">{deadlineAt}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-emerald-600 font-semibold pt-2 border-t border-slate-200 mt-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Đưa mã này vào thiết bị trước cửa phòng để check-in và mở khóa</span>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
