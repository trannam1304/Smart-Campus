import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { InteractiveFloorPlan } from '../../components/booking/InteractiveFloorPlan';
import { BookingModal } from '../../components/booking/BookingModal';
import { Toast } from '../../components/ui/Toast';
import { QRModal } from '../../components/booking/QRModal';
import { Room } from '../../types/booking';
import { MapPin, Info } from 'lucide-react';

export const ArchitecturalMapPage: React.FC = () => {
  const { floors } = useBooking();
  const [selectedFloorNumber, setSelectedFloorNumber] = useState<number>(0);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [defaultDate, setDefaultDate] = useState<string>('');
  const [defaultTime, setDefaultTime] = useState<string>('');

  const selectedFloor = floors.find(f => f.floorNumber === selectedFloorNumber) || floors[0];

  const handleBookRoom = (room: Room, dDate?: string, dTime?: string) => {
    setSelectedRoom(room);
    if (dDate) setDefaultDate(dDate);
    if (dTime) setDefaultTime(dTime);
    setIsBookingOpen(true);
  };

  const [qrData, setQrData] = useState<any>(null);

  const handleBookingSuccess = (booking: any) => {
    setQrData(booking);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl p-8 shadow-xl">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur">
            <MapPin className="w-3.5 h-3.5 text-blue-400" /> Sơ Đồ Kiến Trúc Thư Viện Tòa L
          </span>
          <h1 className="text-3xl font-black tracking-tight">Sơ Đồ Chọn Phòng Trực Tiếp Trên Bản Vẽ Tầng</h1>
          <p className="text-xs font-medium text-slate-300 max-w-2xl">
            Di chuột (hover) hoặc bấm vào vị trí các phòng trên sơ đồ tầng để xem thông tin và đặt phòng trực tiếp. Chọn ngày giờ để xem trạng thái phòng tại thời điểm đó.
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0 bg-white rounded-3xl border border-slate-200 p-4 shadow-sm space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block px-2 mb-2">
            Danh Sách Tầng (Vertical Bar)
          </span>

          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible">
            {floors.map((f) => {
              const isSelected = f.floorNumber === selectedFloorNumber;
              return (
                <button
                  key={f.floorNumber}
                  onClick={() => setSelectedFloorNumber(f.floorNumber)}
                  className={`flex-1 lg:w-full p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black">{f.floorCode}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-xl font-black text-slate-900">{selectedFloor.floorCode}</h2>
              <p className="text-xs text-slate-500 font-medium">{selectedFloor.description}</p>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl">
              Bấm vào phòng để tương tác
            </span>
          </div>

          {selectedFloor && (
            <InteractiveFloorPlan
              floorId={selectedFloor.floorNumber.toString()}
              onBookRoom={handleBookRoom}
            />
          )}
        </div>
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        room={selectedRoom}
        onSuccess={handleBookingSuccess}
        defaultDate={defaultDate}
        defaultStartTime={defaultTime}
      />

      <QRModal
        isOpen={!!qrData}
        onClose={() => setQrData(null)}
        booking={qrData}
      />

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
