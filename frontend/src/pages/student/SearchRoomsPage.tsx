import React, { useState, useEffect, useCallback } from 'react';
import { BookingModal } from '../../components/booking/BookingModal';
import { RoomTimelineModal } from '../../components/booking/RoomTimelineModal';
import { QRModal } from '../../components/booking/QRModal';
import { Toast } from '../../components/ui/Toast';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Room, DeviceCategory } from '../../types/booking';
import { Search, Filter, Users, Bookmark, Calendar, Loader2, AlertCircle } from 'lucide-react';
import { getRoomsApi } from '../../api/roomApi';
import { getErrorMessage } from '../../api/errorMessages';
import { getRoomColor } from '../../utils/roomColors';
import { minOccupancy } from '../../utils/bookingValidation';
import { USE_MOCK } from '../../config/env';
import { mockStore } from '../../api/mock/mockStore';

const EQUIPMENT_OPTIONS: { id: DeviceCategory; label: string }[] = [
  { id: 'PROJECTOR', label: 'Máy chiếu' },
  { id: 'TV', label: 'Smart TV/Màn hình' },
  { id: 'WHITEBOARD', label: 'Bảng (từ/tương tác)' },
  { id: 'AC', label: 'Điều hòa' },
  { id: 'SOCKET', label: 'Ổ cắm điện' },
  { id: 'AUDIO', label: 'Loa/Âm thanh' },
];

export const SearchRoomsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('07:30');
  const [endTime, setEndTime] = useState<string>('09:30');
  const [minCap, setMinCap] = useState<number>(0);
  const [selectedFloor, setSelectedFloor] = useState<number | ''>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<DeviceCategory[]>([]);

  // Giữ buildingId trong code nhưng ẩn khỏi giao diện (chỉ có Tòa L)
  const buildingId = 'Tòa L';

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [timelineRoom, setTimelineRoom] = useState<Room | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleEquipment = (id: DeviceCategory) => {
    setSelectedEquipment((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const fetchRooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getRoomsApi({
        q: searchTerm || undefined,
        roomType: selectedRoomType || undefined,
        date: date || undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        capacity: minCap || undefined,
        buildingId: buildingId || undefined,
        floor: selectedFloor !== '' ? Number(selectedFloor) : undefined,
        equipment: selectedEquipment.length > 0 ? selectedEquipment : undefined,
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
  }, [searchTerm, selectedRoomType, date, startTime, endTime, minCap, buildingId, selectedFloor, selectedEquipment]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRooms();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchRooms]);

  useEffect(() => {
    if (USE_MOCK) {
      const unsub = mockStore.subscribe(() => {
        fetchRooms();
      });
      return unsub;
    }
  }, [fetchRooms]);

  const handleBookRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsBookingOpen(true);
  };

  const handleBookingSuccess = (booking: any) => {
    if (booking.bookingStatus === 'PENDING_APPROVAL') {
      setToastMessage('Đã gửi yêu cầu đặt phòng hội nghị thành công. Vui lòng chờ Quản trị viên phê duyệt.');
    } else {
      setQrData(booking);
    }
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
          Bố cục tra cứu dạng ngang lọc theo thời gian, sức chứa, tầng và các thiết bị phòng.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
          <Filter className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="whitespace-nowrap">Bộ Lọc Nâng Cao:</span>
        </div>

        {/* Basic Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="relative min-w-0">
            <input
              type="text"
              placeholder="Mã phòng (VD: L.001)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-0"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="min-w-0">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="datetime-input w-full min-w-0"
              aria-label="Ngày sử dụng"
            />
          </div>

          <div className="flex gap-2 min-w-0">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="datetime-input w-1/2 min-w-0"
              aria-label="Giờ bắt đầu"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="datetime-input w-1/2 min-w-0"
              aria-label="Giờ kết thúc"
            />
          </div>

          <div className="min-w-0">
            <select
              value={selectedRoomType}
              onChange={(e) => setSelectedRoomType(e.target.value)}
              aria-label="Loại phòng"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 min-w-0"
            >
              <option value="">Tất cả loại phòng</option>
              <option value="Phòng học nhóm">Phòng học nhóm</option>
              <option value="Phòng thuyết trình">Phòng thuyết trình</option>
              <option value="Phòng video">Phòng video</option>
              <option value="Phòng tự học">Phòng tự học</option>
              <option value="Phòng hội nghị">Phòng hội nghị</option>
            </select>
          </div>

          <div className="min-w-0">
            <select
              value={minCap}
              onChange={(e) => setMinCap(Number(e.target.value))}
              aria-label="Sức chứa"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 min-w-0"
            >
              <option value={0}>Tất cả sức chứa</option>
              <option value={5}>Từ 5 người</option>
              <option value={7}>Từ 7 người</option>
              <option value={9}>Từ 9 người</option>
              <option value={15}>Từ 15 người</option>
            </select>
          </div>

          {/* Thay ô Tất cả Tòa nhà bằng Tất cả tầng */}
          <div className="min-w-0">
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value === '' ? '' : Number(e.target.value))}
              aria-label="Chọn tầng"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white text-slate-800 min-w-0"
            >
              <option value="">Tất cả tầng</option>
              <option value={0}>Tầng G</option>
              <option value={1}>Tầng 1</option>
              <option value={2}>Tầng 2</option>
              <option value={3}>Tầng 3</option>
              <option value={4}>Tầng 4</option>
              <option value={5}>Tầng 5</option>
            </select>
          </div>
        </div>

        {/* Multi-select Equipment Filter */}
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <div className="text-xs font-bold text-slate-700">
            Trang thiết bị cần có (phòng phải có đủ các thiết bị được chọn và hoạt động tốt):
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {EQUIPMENT_OPTIONS.map((item) => {
              const isSelected = selectedEquipment.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleEquipment(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="w-3.5 h-3.5 rounded text-blue-600 pointer-events-none accent-blue-600"
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {selectedEquipment.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedEquipment([])}
                className="text-xs text-rose-600 hover:underline font-semibold ml-2"
              >
                Xóa chọn
              </button>
            )}

            <button
              onClick={fetchRooms}
              className="ml-auto bg-slate-900 text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" /> Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
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
            <button
              onClick={fetchRooms}
              className="mt-4 text-xs font-semibold bg-white px-4 py-2 rounded-xl border border-rose-200 hover:bg-rose-100"
            >
              Thử lại
            </button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="bg-slate-50 p-12 rounded-2xl border border-slate-200 flex flex-col items-center text-center text-slate-500">
            <Search className="w-12 h-12 mb-4 text-slate-300" />
            <p className="font-bold text-slate-600">
              Không có phòng phù hợp với bộ lọc, vui lòng thay đổi tiêu chí.
            </p>
          </div>
        ) : (
          rooms.map((room) => {
            const minOcc = minOccupancy(room.capacity);
            const statusColor = getRoomColor(room.status as any);
            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="min-w-[64px] px-2 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: statusColor.fill,
                      borderColor: statusColor.stroke,
                      color: statusColor.text,
                    }}
                  >
                    <span className="text-xs font-black">{room.roomCode}</span>
                    <span className="text-[9px] font-bold opacity-80 whitespace-nowrap">{room.floorCode}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">Phòng {room.roomCode}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {room.roomType}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-medium">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> Sức chứa: {minOcc} - {room.capacity} người
                      </span>
                      <span className="hidden sm:inline">
                        Thiết bị: {room.devices.map((d) => d.name).join(', ')}
                      </span>
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
