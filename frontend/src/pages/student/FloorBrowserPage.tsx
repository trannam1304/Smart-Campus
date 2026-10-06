import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { FloorAccordion } from '../../components/booking/FloorAccordion';
import { BookingModal } from '../../components/booking/BookingModal';
import { RoomTimelineModal } from '../../components/booking/RoomTimelineModal';
import { QRModal } from '../../components/booking/QRModal';
import { Toast } from '../../components/ui/Toast';
import { Room } from '../../types/booking';
import { Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FloorBrowserPage: React.FC = () => {
  const { floors } = useBooking();
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [scheduleRoom, setScheduleRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const navigate = useNavigate();

  const [defaultDate, setDefaultDate] = useState<string>('');
  const [defaultTime, setDefaultTime] = useState<string>('');

  const handleBookRoom = (room: Room, dDate?: string, dTime?: string) => {
    setSelectedRoom(room);
    if (dDate) setDefaultDate(dDate);
    if (dTime) setDefaultTime(dTime);
    setIsModalOpen(true);
  };

  const handleViewSchedule = (room: Room) => {
    setScheduleRoom(room);
    setIsTimelineOpen(true);
  };

  const handleBookSlotFromSchedule = (room: Room, date: string, timeSlot: string) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleReportIncident = (room: Room) => {
    navigate('/incident-report', { state: { roomId: room.id, roomCode: room.roomCode } });
  };

  const [qrData, setQrData] = useState<any>(null);

  const handleBookingSuccess = (booking: any) => {
    setQrData(booking);
  };

  const filteredFloors = floors.map(floor => ({
    ...floor,
    rooms: floor.rooms.filter(room => {
      const matchSearch = room.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) || room.building.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || room.status === statusFilter;
      return matchSearch && matchStatus;
    })
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-black tracking-tight">Tra Cứu & Đặt Phòng Thư Viện Tòa L</h1>
        <p className="text-xs font-medium text-blue-100 mt-1">
          Duyệt danh sách các tầng thư viện, bấm "Xem lịch bận" để kiểm tra khung giờ rảnh/bận hoặc bấm "Đặt phòng ngay".
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Tìm theo mã phòng (L.001, L.101)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Trống (Sẵn sàng)</option>
            <option value="BOOKED">Đã đặt trước</option>
            <option value="MAINTENANCE">Đang bảo trì</option>
          </select>
        </div>
      </div>

      {/* Floor Accordion with Room Cards containing Xem Lịch Bận button */}
      <FloorAccordion
        floors={filteredFloors}
        onBookRoom={handleBookRoom}
        onViewSchedule={handleViewSchedule}
        onReportIncident={handleReportIncident}
      />

      {/* Booking Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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



      <RoomTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        room={scheduleRoom}
        onSelectSlot={(d, t) => {
          handleBookRoom(scheduleRoom!, d, t);
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
