import React from 'react';
import { Modal } from '../ui/Modal';
import { QrCode, Calendar, Clock, MapPin, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
}

export const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, booking }) => {
  if (!booking) return null;

  // Adapt for both Booking (legacy) and CreateBookingResponse (new API)
  const isNewApi = !!booking.qrCodeImageBase64;
  
  const qrCodeData = isNewApi ? booking.qrCodeData : booking.qrCode;
  const roomCode = booking.roomCode;
  
  const allowEarlyFrom = isNewApi ? booking.checkInWindow.allowEarlyFrom : booking.startTime;
  const deadlineAt = isNewApi ? booking.checkInWindow.deadlineAt : booking.endTime;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Mã QR Check-in Điểm Danh">
      <div className="text-center space-y-4">
        {/* QR Code */}
        <div className="inline-block p-4 bg-white rounded-2xl border-2 border-dashed border-blue-200 shadow-inner">
          <div className="w-48 h-48 bg-white rounded-xl p-1 flex flex-col justify-center items-center relative overflow-hidden group">
            {isNewApi ? (
              <img src={booking.qrCodeImageBase64} alt="QR Code" className="w-full h-full object-contain bg-white rounded-lg" />
            ) : (
              <QRCodeSVG value={qrCodeData} size={184} className="w-full h-full" />
            )}
          </div>
          <div className="mt-3">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Mã dự phòng (Nhập tay)</span>
            <span className="block font-mono text-[11px] font-black text-slate-700 bg-slate-100 py-1.5 px-3 rounded-lg border border-slate-200 select-all">
              {qrCodeData}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-xs font-medium text-slate-700 border border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>Phòng: <strong className="text-slate-900">{roomCode}</strong></span>
          </div>
          {!isNewApi && (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Ngày: <strong>{booking.date}</strong></span>
              </div>
            </>
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

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
        >
          Đóng cửa sổ
        </button>
      </div>
    </Modal>
  );
};
