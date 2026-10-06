import React from 'react';
import { Room } from '../../types/booking';
import { StatusBadge } from '../ui/StatusBadge';
import { Users, Tv, Monitor, Wifi, AlertTriangle, Tag, Bookmark, Calendar } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onBook: (room: Room) => void;
  onViewSchedule?: (room: Room) => void;
  onReportIncident?: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onBook, onViewSchedule, onReportIncident }) => {
  const isAvailable = room.status === 'AVAILABLE';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between group">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                Phòng {room.roomCode}
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                <Tag className="w-3 h-3 text-blue-500" /> {room.roomType}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {room.building} - {room.floorCode}
            </span>
          </div>
          <StatusBadge status={room.status} />
        </div>

        {/* Capacity & Specs */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-600 mb-3 py-2 px-3 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-slate-400" />
            <span>Sức chứa: <strong>{room.capacity} người</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span>Wifi 5G Library</span>
          </div>
        </div>

        {/* Devices list */}
        <div className="space-y-1.5 mb-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Trang thiết bị phòng:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {room.devices.map((dev) => (
              <span
                key={dev.id}
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md ${
                  dev.status === 'GOOD'
                    ? 'bg-slate-100 text-slate-700'
                    : 'bg-rose-100 text-rose-700 font-semibold'
                }`}
              >
                {dev.name.includes('TV') ? <Tv className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                {dev.name} {dev.status !== 'GOOD' && '(Hỏng)'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions - Button Xem lịch bận kế bên Đặt phòng ngay */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        {onViewSchedule && (
          <button
            onClick={() => onViewSchedule(room)}
            title="Xem lịch bận"
            className="py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors flex items-center gap-1"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Xem lịch bận</span>
          </button>
        )}

        <button
          onClick={() => onBook(room)}
          disabled={!isAvailable}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
            isAvailable
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-95'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>{isAvailable ? 'Đặt phòng ngay' : 'Không khả dụng'}</span>
        </button>

        {onReportIncident && (
          <button
            onClick={() => onReportIncident(room)}
            title="Báo cáo hỏng thiết bị"
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
