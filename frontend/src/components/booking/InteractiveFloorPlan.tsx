import React, { useState, useEffect, useCallback } from 'react';
import { FloorData, Room } from '../../types/booking';
import { StatusBadge } from '../ui/StatusBadge';
import { Bookmark, Users, Monitor, Copy, Calendar, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import { floorMaps, RoomRect } from '../../data/floorMaps';
import { getRoomColor } from '../../utils/roomColors';
import { getFloorMapApi } from '../../api/roomApi';

const getRoundedDateAndTime = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 30) * 30;
  now.setMinutes(roundedMinutes);
  
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  
  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${h}:${m}`
  };
};

interface InteractiveFloorPlanProps {
  floorId: string;
  onBookRoom: (room: Room, defaultDate: string, defaultTime: string) => void;
  onViewSchedule?: (room: Room) => void;
}

export const InteractiveFloorPlan: React.FC<InteractiveFloorPlanProps> = ({ floorId, onBookRoom, onViewSchedule }) => {
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [floor, setFloor] = useState<FloorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Date and Time picker state
  const { date: initDate, time: initTime } = getRoundedDateAndTime();
  const [selectedDate, setSelectedDate] = useState(initDate);
  const [selectedTime, setSelectedTime] = useState(initTime);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const isCalibrateMode = urlParams.get('calibrate') === '1' && import.meta.env.DEV;
  const [localMaps, setLocalMaps] = useState<Record<string, RoomRect>>({});
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const fetchData = useCallback(async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);
    try {
      const res = await getFloorMapApi(floorId, selectedDate, selectedTime);
      if (res.success && res.data) {
        setFloor(res.data);
        const initialMap: Record<string, RoomRect> = {};
        res.data.rooms.forEach((r: Room) => {
          initialMap[r.roomCode] = floorMaps[r.roomCode] || { top: 0, left: 0, width: 10, height: 10 };
        });
        setLocalMaps(initialMap);
      } else {
        setError(res.message || 'Lỗi tải dữ liệu tầng');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi mạng');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [floorId, selectedDate, selectedTime]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(true);
    }, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    setAspectRatio(img.naturalWidth / img.naturalHeight);
  };

  const handleRectChange = (roomCode: string, field: keyof RoomRect, value: number) => {
    setLocalMaps(prev => ({
      ...prev,
      [roomCode]: { ...prev[roomCode], [field]: value }
    }));
  };

  const copyJson = () => {
    const jsonStr = JSON.stringify(localMaps, null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert('Copied to clipboard. Paste this into src/data/floorMaps.ts to update.');
  };

  const openPanel = (room: Room, e: React.MouseEvent | React.KeyboardEvent) => {
    if (isCalibrateMode) {
      setSelectedRoomId(room.roomCode);
      return;
    }
    setHoveredRoom(room);
    const target = e.currentTarget as HTMLElement;
    const bbox = target.getBoundingClientRect();
    // Centered horizontally, below the room vertically
    setTooltipPos({ x: bbox.left + bbox.width / 2, y: bbox.top + bbox.height + 10 });
  };

  const handleKeyDown = (e: React.KeyboardEvent, room: Room) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPanel(room, e);
    }
  };

  if (isLoading && !floor) {
    return (
      <div className="w-full h-[500px] bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center border border-slate-200">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !floor) {
    return (
      <div className="w-full h-[300px] bg-rose-50 rounded-2xl flex flex-col items-center justify-center border border-rose-200 space-y-4">
        <AlertCircle className="w-8 h-8 text-rose-500" />
        <p className="text-sm font-semibold text-rose-700">{error}</p>
        <button onClick={() => fetchData()} className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700">
          Thử lại
        </button>
      </div>
    );
  }

  if (!floor) return null;

  return (
    <div className="relative rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-inner flex flex-col items-center justify-center overflow-hidden w-full">
      
      {/* Date & Time Picker */}
      <div className="w-full mb-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            <input 
              type="date" 
              value={selectedDate} 
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm border-none bg-slate-50 font-semibold px-2 py-1 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <input 
              type="time" 
              step="1800"
              value={selectedTime} 
              onChange={e => setSelectedTime(e.target.value)}
              className="text-sm border-none bg-slate-50 font-semibold px-2 py-1 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => fetchData(true)}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                disabled={isRefreshing}
            >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Đang làm mới...' : 'Làm mới'}</span>
            </button>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Trống</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Đã Đặt</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Bảo Trì</div>
                <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Bạn Đặt</div>
            </div>
        </div>
      </div>

      {isCalibrateMode && (
        <div className="w-full mb-4 p-4 bg-yellow-100 rounded-lg flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-yellow-800">Chế độ hiệu chỉnh (Calibration)</h3>
                <button onClick={copyJson} className="px-3 py-1 bg-yellow-600 text-white rounded shadow text-sm flex gap-1 items-center"><Copy className="w-4 h-4"/> Copy JSON</button>
            </div>
            {selectedRoomId && (
                <div className="grid grid-cols-4 gap-2">
                    {['top', 'left', 'width', 'height'].map(field => (
                        <div key={field}>
                            <label className="text-xs">{field} (%)</label>
                            <input 
                                type="number" step="0.1"
                                className="w-full px-2 py-1 text-sm border rounded"
                                value={localMaps[selectedRoomId]?.[field as keyof RoomRect] || 0}
                                onChange={(e) => handleRectChange(selectedRoomId, field as keyof RoomRect, parseFloat(e.target.value))}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}

      <div className="relative w-full max-w-full inline-block border border-slate-200 rounded-xl overflow-hidden shadow-md bg-white">
        <div 
          className="relative w-full"
          style={aspectRatio ? { aspectRatio: `${aspectRatio}` } : {}}
        >
            <img
            src={floor.mapImage}
            alt={`Sơ đồ bản vẽ ${floor.floorCode}`}
            onLoad={handleImageLoad}
            className="block w-full h-auto pointer-events-none"
            />

            {aspectRatio && (
            <svg 
                className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
            >
                {floor.rooms.map((room) => {
                    const rect = localMaps[room.roomCode];
                    if (!rect) return null;
                    const colors = getRoomColor(room.status, room.colorCode);

                    return (
                        <rect
                            key={room.id}
                            x={rect.left}
                            y={rect.top}
                            width={rect.width}
                            height={rect.height}
                            fill={colors.fill}
                            stroke={colors.stroke}
                            strokeWidth="0.5"
                            role="button"
                            tabIndex={0}
                            aria-label={`Phòng ${room.roomCode} - ${colors.label}`}
                            className="pointer-events-auto cursor-pointer transition-all hover:opacity-80 outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={(e) => openPanel(room, e)}
                            onKeyDown={(e) => handleKeyDown(e, room)}
                        />
                    );
                })}
            </svg>
            )}
            
            {aspectRatio && floor.rooms.map(room => {
                const rect = localMaps[room.roomCode];
                if (!rect) return null;
                const colors = getRoomColor(room.status, room.colorCode);
                return (
                    <div
                        key={`text-${room.id}`}
                        className="absolute flex items-center justify-center pointer-events-none text-[clamp(8px,1vw,14px)] font-black drop-shadow-sm"
                        style={{
                            top: `${rect.top}%`,
                            left: `${rect.left}%`,
                            width: `${rect.width}%`,
                            height: `${rect.height}%`,
                            color: colors.text
                        }}
                    >
                        {room.roomCode}
                    </div>
                )
            })}
        </div>
      </div>

      {/* Popover / Panel Chi Tiết */}
      {hoveredRoom && !isCalibrateMode && (
        <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setHoveredRoom(null)}></div>
            <div
            style={{
                position: 'fixed',
                left: `${Math.min(Math.max(tooltipPos.x, 150), window.innerWidth - 150)}px`,
                top: `${tooltipPos.y}px`,
                transform: 'translate(-50%, 0)',
            }}
            className="z-50 w-72 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-200 animate-fade-in pointer-events-auto space-y-3"
            >
            <div className="flex items-center justify-between">
                <h4 className="font-black text-sm">{hoveredRoom.roomCode}</h4>
                <StatusBadge status={hoveredRoom.status} />
            </div>

            <div className="text-xs space-y-1 text-slate-600 font-medium">
                <div className="font-bold text-slate-800">{hoveredRoom.roomType}</div>
                <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sức chứa: {Math.ceil(hoveredRoom.capacity * 0.5)} - {hoveredRoom.capacity} người</span>
                </div>
                <div className="flex items-start gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span className="flex-1">Thiết bị: {hoveredRoom.devices.map(d => `${d.name} (${d.status})`).join(', ')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Giờ mở cửa: {floor.floorNumber <= 2 ? '07:30 - 20:00' : '07:30 - 17:00'}</span>
                </div>
            </div>

            {hoveredRoom.status === 'AVAILABLE' && (
                <button
                onClick={() => {
                    setHoveredRoom(null);
                    onBookRoom(hoveredRoom, selectedDate, selectedTime);
                }}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Đặt phòng này</span>
                </button>
            )}

            {hoveredRoom.status === 'BOOKED' && (
                <div className="space-y-2">
                    <div className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100 text-center">
                        Phòng đã có người đặt trong khung giờ này
                    </div>
                    {onViewSchedule && (
                        <button
                            onClick={() => {
                                setHoveredRoom(null);
                                onViewSchedule(hoveredRoom);
                            }}
                            className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center gap-1.5 transition-all"
                        >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Xem lịch bận để chọn giờ khác</span>
                        </button>
                    )}
                </div>
            )}

            {hoveredRoom.status === 'MAINTENANCE' && (
                <div className="text-[10px] text-amber-700 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200 text-center">
                    Phòng đang bảo trì. Xin lỗi vì sự bất tiện này.
                </div>
            )}

            {hoveredRoom.status === 'SELF_BOOKED' && (
                <div className="text-[10px] text-blue-700 font-bold bg-blue-50 p-2 rounded-lg border border-blue-200 text-center">
                    Bạn đã đặt phòng này vào khung giờ này.
                </div>
            )}
            </div>
        </>
      )}
    </div>
  );
};
