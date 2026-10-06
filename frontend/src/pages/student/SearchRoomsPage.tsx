import React, { useState, useEffect, useCallback } from 'react';
import { useBooking } from '../../context/BookingContext';
import { BookingModal } from '../../components/booking/BookingModal';
import { RoomTimelineModal } from '../../components/booking/RoomTimelineModal';
import { QRModal } from '../../components/booking/QRModal';
import { Toast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Room } from '../../types/booking';
import { Search, Filter, Users, Bookmark, Calendar, Loader2, AlertCircle, Video } from 'lucide-react';
import { getRoomsApi } from '../../api/roomApi';
import { getErrorMessage } from '../../api/errorMessages';
import { getRoomColor } from '../../utils/roomColors';
import { minOccupancy } from '../../utils/bookingValidation';

export const SearchRoomsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('07:30');
  const [endTime, setEndTime] = useState<string>('09:30');
  const [minCap, setMinCap] = useState<number>(0);
  const [buildingId, setBuildingId] = useState<string>('');
  const [hasProjector, setHasProjector] = useState<boolean>(false);
  
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [timelineRoom, setTimelineRoom] = useState<Room | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRoomsApi({
        q: searchTerm,
        date,
        startTime,
        endTime,
        capacity: minCap || undefined,
        buildingId: buildingId || undefined,
        hasProjector: hasProjector || undefined
      });
      if (res.success && res.data) {
        setRooms(res.data.items);
      } else {
        setError(getErrorMessage(res));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, date, startTime, endTime, minCap, buildingId, hasProjector]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchRooms]);

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (booking: any) => {
    setQrData(booking);
    fetchRooms(); // Refresh room status
  };

  const handleViewTimeline = (room: Room) => {
    setTimelineRoom(room);
    setIsTimelineOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 rounded-3xl p-8 text-white shadow-xl">
        <h1 className="text-3xl font-black tracking-tight">Tìm Phòng Học Thư Viện</h1>
        <p className="text-xs text-blue-100 font-medium mt-1">
          Bố cục tra cứu dạng ngang (Horizontal Layout) lọc theo loại phòng và sức chứa.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Bộ Lọc Nâng Cao:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Mã phòng (VD: L.001)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-1/2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={minCap}
            onChange={(e) => setMinCap(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value={0}>Tất cả sức chứa</option>
            <option value={6}>Từ 6 người</option>
            <option value={10}>Từ 10 người</option>
            <option value={15}>Từ 15 người</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <label className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer">
            <input type="checkbox" checked={hasProjector} onChange={(e) => setHasProjector(e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
            <Video className="w-3.5 h-3.5 text-slate-500" />
            Có máy chiếu
          </label>
          <select
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">Tất cả Tòa nhà</option>
            <option value="Tòa L">Tòa L (Thư viện)</option>
          </select>

          <button onClick={fetchRooms} className="ml-auto bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5" /> Tìm kiếm
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm font-semibold">Đang tìm phòng phù hợp...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 text-rose-700 p-6 rounded-2xl border border-rose-200 flex flex-col items-center text-center">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="font-bold">{error}</p>
            <button onClick={fetchRooms} className="mt-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-100">Thử lại</button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 flex flex-col items-center text-center text-slate-500">
            <Search className="w-12 h-12 mb-4 text-slate-300" />
            <p className="font-bold text-slate-600">Không có phòng phù hợp với bộ lọc, vui lòng thay đổi tiêu chí.</p>
          </div>
        ) : (
          rooms.map((room) => {
            const minOcc = minOccupancy(room.capacity);
            const statusColor = getRoomColor(room.status as any);
            return (
              <div key={room.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border" style={{ backgroundColor: statusColor.fill, borderColor: statusColor.stroke, color: statusColor.text }}>
                    <span className="text-xs font-black">{room.roomCode}</span>
                    <span className="text-[9px] font-bold opacity-80">{room.floorCode}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Phòng {room.roomCode}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">{room.roomType}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Yêu cầu: {minOcc} - {room.capacity} người</span>
                      <span className="hidden sm:inline">Thiết bị: {room.devices.map(d => d.name).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
                  <StatusBadge status={room.status} />
                  <button
                    onClick={() => handleViewTimeline(room)}
                    className="py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Xem lịch bận</span>
                  </button>
                  <button
                    onClick={() => handleBookRoom(room)}
                    disabled={room.status !== 'AVAILABLE'}
                    className={`py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      room.status === 'AVAILABLE'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Đặt phòng</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        room={selectedRoom}
        onSuccess={handleBookingSuccess}
        defaultDate={date}
        defaultStartTime={startTime}
      />

      <QRModal
        isOpen={!!qrData}
        onClose={() => setQrData(null)}
        booking={qrData}
      />

      <RoomTimelineModal
        isOpen={isTimelineOpen}
        onClose={() => setIsTimelineOpen(false)}
        room={timelineRoom}
        onSelectSlot={(d, t) => {
          setDate(d);
          setStartTime(t);
          setSelectedRoom(timelineRoom);
          setIsBookingOpen(true);
        }}
      />

      {toastMessage && (
        <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      )}
    </div>
  );
};
